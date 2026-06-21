const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// 1. GET ALL SUBJECTS WITH SECTIONS (Using your junction table)
router.get('/', async (req, res, next) => {
  try {
    // We select your actual column names: id, subject_name, subject_icon, grade_level
    // And we traverse the foreign key relationship through subject_class_assignments down to classes!
// Quick Backend check: Make sure your query fetches structural joins, for example:
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
              name: `${assignment.classes.class_name} - ${assignment.classes.section_name}`,
              students: 0 // Default placeholder since capacity/student counts are tracked separately
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

// 2. CREATE A NEW SUBJECT
router.post('/', async (req, res, next) => {
  const { name, icon, grade } = req.body;

  try {
    // Insert using your real column keys: subject_name, subject_icon, grade_level
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

// 3. DELETE A SUBJECT BY ID
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;