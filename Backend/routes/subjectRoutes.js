const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// 1. GET ALL SUBJECTS WITH SECTIONS (Using your junction table)
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
    .from('subjects')
    .select(`
        id,
        subject_name,
        grade_level,
        subject_icon,
        subject_class_assignments (
        classes (
            id,
            class_name,
            section_name
        )
        )
    `);

    if (error) throw error;

    // Map your real schema's properties back to what the frontend expects
    const formattedData = data.map((sub) => {
      // Flatten the nested array from the junction table assignment
      const classesList = sub.subject_class_assignments
        ? sub.subject_class_assignments
            .filter(assignment => assignment.classes !== null)
            .map(assignment => ({
              name: assignment.classes.section_name 
                ? `${assignment.classes.class_name} - ${assignment.classes.section_name}`
                : assignment.classes.class_name,
              students: 0 // Default placeholder
            }))
        : [];

      return {
        id: sub.id,
        name: sub.subject_name,
        icon: sub.subject_icon || '📘',
        grade: sub.grade_level,
        classes: classesList
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    next(error); 
  }
});

// --- NEW: FETCH DYNAMIC SECTIONS FOR TABS ---
router.get('/:identifier/sections', async (req, res, next) => {
  const { identifier } = req.params;
  
  try {
    // Check if the frontend sent a UUID or a plain text name (like "Science")
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let query = supabase
      .from('subjects')
      .select(`
        subject_class_assignments (
          classes (
            id,
            class_name,
            section_name
          )
        )
      `);

    // Route the query based on what the frontend provided
    if (isUUID) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('subject_name', identifier);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.status(200).json([]); // Return empty array to prevent UI crashing
    }

    // Format the junction table data back to simple tab objects
    const sectionsList = data.subject_class_assignments
      ? data.subject_class_assignments
          .filter(assignment => assignment.classes !== null)
          .map(assignment => ({
            id: assignment.classes.id,
            name: assignment.classes.section_name 
              ? `${assignment.classes.class_name} - ${assignment.classes.section_name}`
              : assignment.classes.class_name
          }))
      : [];

    res.status(200).json(sectionsList);
  } catch (error) {
    console.error("Sections Fetch Error:", error);
    res.status(500).json({ error: 'Failed to fetch subject sections' });
  }
});

// 2. CREATE A NEW SUBJECT
router.post('/', async (req, res, next) => {
  const { name, icon, grade } = req.body;

  try {
    const { data: newSubject, error: subjectError } = await supabase
      .from('subjects')
      .insert([{ 
        subject_name: name, 
        subject_icon: icon, 
        grade_level: grade 
      }])
      .select()
      .single();

    if (subjectError) throw subjectError;

    res.status(201).json({ message: 'Subject created successfully!', data: newSubject });
  } catch (error) {
    next(error);
  }
});

// Inside subjectRoutes.js (PUT route)
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, icon, grade, sections } = req.body;

  try {
    const { error: updateError } = await supabase
      .from('subjects')
      .update({ 
        subject_name: name, 
        subject_icon: icon, 
        grade_level: grade 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Clear old junction assignments
    await supabase.from('subject_class_assignments').delete().eq('subject_id', id);

    // Insert newly mapped section assignments
    if (sections && Array.isArray(sections) && sections.length > 0) {
      const assignments = sections
        .map(sec => ({
          subject_id: id,
          class_id: sec.id || sec.class_id // Map correctly
        }))
        .filter(a => a.class_id);

      if (assignments.length > 0) {
        await supabase.from('subject_class_assignments').insert(assignments);
      }
    }

    res.status(200).json({ message: 'Subject updated successfully!' });
  } catch (error) {
    next(error);
  }
});

// 3. DELETE A SUBJECT BY ID
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const { error: assignmentError } = await supabase
      .from('subject_class_assignments')
      .delete()
      .eq('subject_id', id);

    if (assignmentError) throw assignmentError;

    const { error: subjectError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (subjectError) throw subjectError;

    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;