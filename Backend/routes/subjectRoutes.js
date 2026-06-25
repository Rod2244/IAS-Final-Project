const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

const normalizeSection = (section = {}) => {
  const normalized = {
    id: section.id || section.class_id || section.classId || null,
    class_name: (section.class_name || section.name || '').toString().trim(),
    section_name: section.section_name ? section.section_name.toString().trim() : '',
    grade_level: section.grade_level || section.grade || section.subject_grade || null,
  };

  if (!normalized.class_name && normalized.section_name) {
    if (normalized.section_name.includes(' - ')) {
      const [maybeClass, maybeSection] = normalized.section_name.split(' - ', 2);
      normalized.class_name = maybeClass.trim();
      normalized.section_name = maybeSection.trim();
    } else {
      normalized.class_name = normalized.section_name;
      normalized.section_name = '';
    }
  }

  return normalized;
};

const resolveClassId = async (section, gradeLevel = 'Unassigned', teacherId = null) => {
  const normalized = normalizeSection(section);
  if (!normalized) return null;
  if (normalized.id) {
    const { data: existingClass, error: classFetchError } = await supabaseAdmin
      .from('classes')
      .select('id, class_name, section_name, grade_level, teacher_id')
      .eq('id', normalized.id)
      .maybeSingle();
    if (classFetchError) throw classFetchError;
    if (existingClass && existingClass.id) {
      const updatePayload = {};
      if (teacherId && teacherId !== existingClass.teacher_id) {
        updatePayload.teacher_id = teacherId;
      }
      if (normalized.class_name && normalized.class_name !== existingClass.class_name) {
        updatePayload.class_name = normalized.class_name;
      }
      if (normalized.section_name !== existingClass.section_name) {
        updatePayload.section_name = normalized.section_name;
      }
      if (normalized.grade_level && normalized.grade_level !== existingClass.grade_level) {
        updatePayload.grade_level = normalized.grade_level;
      }
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('classes')
          .update(updatePayload)
          .eq('id', existingClass.id);
        if (updateError) throw updateError;
      }
      return existingClass.id;
    }
  }

  let className = normalized.class_name;
  let sectionName = normalized.section_name;

  if (!className) return null;
  if (!sectionName && className.includes(' - ')) {
    const [maybeClass, maybeSection] = className.split(' - ', 2);
    className = maybeClass.trim();
    sectionName = maybeSection.trim();
  }

  let query = supabaseAdmin.from('classes').select('id, class_name, section_name, grade_level, teacher_id');
  if (sectionName) {
    query = query.ilike('class_name', className).ilike('section_name', sectionName);
  } else {
    query = query.ilike('class_name', className);
  }

  const { data: existingClass, error: findError } = await query.maybeSingle();
  if (findError) throw findError;
  if (existingClass && existingClass.id) {
    const updatePayload = {};
    if (teacherId && teacherId !== existingClass.teacher_id) {
      updatePayload.teacher_id = teacherId;
    }
    if (normalized.class_name && normalized.class_name !== existingClass.class_name) {
      updatePayload.class_name = normalized.class_name;
    }
    if (normalized.section_name !== existingClass.section_name) {
      updatePayload.section_name = normalized.section_name;
    }
    if (normalized.grade_level && normalized.grade_level !== existingClass.grade_level) {
      updatePayload.grade_level = normalized.grade_level;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('classes')
        .update(updatePayload)
        .eq('id', existingClass.id);
      if (updateError) throw updateError;
    }
    return existingClass.id;
  }

  const classPayload = {
    class_name: className,
    section_name: sectionName,
    grade_level: normalized.grade_level || gradeLevel || 'Unassigned',
    ...(teacherId ? { teacher_id: teacherId } : {}),
  };

  const { data: insertedClass, error: insertError } = await supabaseAdmin
    .from('classes')
    .insert([classPayload])
    .select('id')
    .single();

  if (insertError) throw insertError;
  return insertedClass.id;
};

// 1. GET ALL SUBJECTS WITH SECTIONS (Using your junction table)
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
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
              id: assignment.classes.id,
              name: assignment.classes.section_name 
                ? `${assignment.classes.class_name} - ${assignment.classes.section_name}`
                : assignment.classes.class_name,
              class_name: assignment.classes.class_name,
              section_name: assignment.classes.section_name,
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

    let query = supabaseAdmin
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

const findTeacherIdForSection = async (normalizedSection, gradeLevel) => {
  if (!normalizedSection) return null;

  const { data: teachers, error } = await supabaseAdmin
    .from('teachers')
    .select('id, grade_level_assignment, class_assignment');

  if (error || !Array.isArray(teachers) || teachers.length === 0) {
    const { data: fallbackTeacher, error: fallbackError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fallbackError) return null;
    if (fallbackTeacher && fallbackTeacher.id) return fallbackTeacher.id;

    const { data: createdTeacher, error: createError } = await supabaseAdmin
      .from('teachers')
      .insert([{ first_name: 'Default', last_name: 'Teacher' }])
      .select('id')
      .single();

    return createError ? null : createdTeacher.id;
  }

  const matchedTeacher = teachers.find((teacher) => {
    const gradeMatch = gradeLevel && teacher.grade_level_assignment === gradeLevel;
    const classMatch = normalizedSection.class_name && teacher.class_assignment === normalizedSection.class_name;
    return gradeMatch || classMatch;
  });

  return (matchedTeacher || teachers[0]).id;
};

const createSubjectClassAssignments = async (subjectId, sections, gradeLevel) => {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return;

  const assignments = [];
  for (const section of sections) {
    const normalizedSection = normalizeSection(section);
    const teacherId = await findTeacherIdForSection(normalizedSection, gradeLevel);
    const classId = await resolveClassId(normalizedSection, gradeLevel, teacherId);
    if (!classId) continue;

    assignments.push({ subject_id: subjectId, class_id: classId, teacher_id: teacherId });
  }

  if (assignments.length > 0) {
    const enrichedAssignments = assignments.map((assignment) => ({
      subject_id: assignment.subject_id,
      class_id: assignment.class_id,
      teacher_id: assignment.teacher_id,
      schedule_day: assignment.schedule_day ?? 'TBA',
      schedule_time: assignment.schedule_time ?? '00:00:00',
      end_time: assignment.end_time ?? '00:00:00',
      room_number: assignment.room_number ?? 'TBA',
    }));

    const { error } = await supabaseAdmin.from('subject_class_assignments').insert(enrichedAssignments);
    if (error) throw error;
  }
};

// 2. CREATE A NEW SUBJECT
router.post('/', async (req, res, next) => {
  const { name, icon, grade, sections } = req.body;

  try {
    const { data: newSubject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .insert([{ 
        subject_name: name, 
        subject_icon: icon, 
        grade_level: grade 
      }])
      .select()
      .single();

    if (subjectError) throw subjectError;

    await createSubjectClassAssignments(newSubject.id, sections, grade);

    res.status(201).json({ message: 'Subject created successfully!', data: newSubject });
  } catch (error) {
    next(error);
  }
});

// Create or assign a section to an existing subject
router.post('/:id/sections', async (req, res, next) => {
  const { id } = req.params;
  const { class_name, section_name, name } = req.body;
  const sectionPayload = {
    name: name || class_name || section_name,
    class_name: class_name || name || section_name,
    section_name: section_name || ''
  };

  try {
    const { data: subjectData, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('grade_level')
      .eq('id', id)
      .single();

    if (subjectError) throw subjectError;
    if (!subjectData) return res.status(404).json({ error: 'Subject not found.' });

    const normalizedSection = normalizeSection(sectionPayload);
    let teacherId = await findTeacherIdForSection(normalizedSection, subjectData.grade_level);
    if (!teacherId) {
      const fallbackTeacher = await supabaseAdmin
        .from('teachers')
        .select('id')
        .limit(1)
        .maybeSingle();
      teacherId = fallbackTeacher?.data?.id || null;
    }

    const classId = await resolveClassId(normalizedSection, subjectData.grade_level || 'Unassigned', teacherId);
    if (!classId) throw new Error('Unable to resolve or create class for section.');

    const assignmentPayload = {
      subject_id: id,
      class_id: classId,
      teacher_id: teacherId,
      schedule_day: 'TBA',
      schedule_time: '00:00:00',
      end_time: '00:00:00',
      room_number: 'TBA',
    };

    const { data, error } = await supabaseAdmin
      .from('subject_class_assignments')
      .insert([assignmentPayload])
      .select();

    if (error) throw error;

    res.status(201).json({ id: classId, name: sectionPayload.class_name });
  } catch (error) {
    next(error);
  }
});

// Inside subjectRoutes.js (PUT route)
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, icon, grade, sections } = req.body;

  try {
    const { error: updateError } = await supabaseAdmin
      .from('subjects')
      .update({ 
        subject_name: name, 
        subject_icon: icon, 
        grade_level: grade 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Clear old junction assignments
    await supabaseAdmin.from('subject_class_assignments').delete().eq('subject_id', id);

    await createSubjectClassAssignments(id, sections, grade);

    res.status(200).json({ message: 'Subject updated successfully!' });
  } catch (error) {
    next(error);
  }
});

// 3. DELETE A SUBJECT BY ID
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const { error: gradeError } = await supabaseAdmin
      .from('grades')
      .delete()
      .eq('subject_id', id);

    if (gradeError) throw gradeError;

    const { error: assignmentError } = await supabaseAdmin
      .from('subject_class_assignments')
      .delete()
      .eq('subject_id', id);

    if (assignmentError) throw assignmentError;

    const { error: subjectError } = await supabaseAdmin
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