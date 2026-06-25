const { supabaseAdmin } = require("../config/supabase");

// Grade Service
const gradeService = {
  // Get all grades
  async getAllGrades() {
    try {
      const { data, error } = await supabaseAdmin.from("grades").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get grades error: ${error.message}`);
    }
  },

// 1. Add this helper method to your gradeService object
async _populateSubjectNames(gradeRecords) {
  const subjectIds = Array.from(
    new Set(gradeRecords.map((record) => record.subject).filter(Boolean))
  );

  if (subjectIds.length === 0) return gradeRecords;

  const { data: subjects, error: subjectError } = await supabaseAdmin
    .from("subjects")
    .select("id, name") // Ensure 'name' is the correct column in your 'subjects' table
    .in("id", subjectIds);

  if (subjectError) throw subjectError;

  const subjectMap = (subjects || []).reduce((acc, sub) => {
    acc[sub.id] = sub.name;
    return acc;
  }, {});

  return gradeRecords.map((record) => ({
    ...record,
    subject_name: subjectMap[record.subject] || "Unknown Subject",
  }));
},

// 2. Update your getGradesByStudent to use both populations
async getGradesByStudent(studentId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("grades")
      .select(`
        *,
        subjects (
          subject_name
        )
      `) // This tells Supabase to "Join" the subjects table
      .eq("student_id", studentId);
      
    if (error) throw error;

    return await this._populateSubjectNames(data);
    
    // Return empty array instead of throwing an error if no grades found
    return data || []; 
  } catch (error) {
    throw new Error(`Get student grades error: ${error.message}`);
  }
},

  // Get grades by teacher
  async getGradesByTeacher(teacherId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("grades")
        .select("*")
        .eq("teacher_id", teacherId);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get teacher grades error: ${error.message}`);
    }
  },

  // Get grades by class
  async getGradesByClass(classId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("grades")
        .select("*")
        .eq("class_id", classId);
      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        const gradesWithNames = await this._populateStudentNames(data);
        return gradesWithNames;
      }

      return data;
    } catch (error) {
      throw new Error(`Get class grades error: ${error.message}`);
    }
  },

// Create grade with dynamic text-to-UUID resolution
  async createGrade(gradeData) {
    try {
      let { 
        student_id, 
        class_id, 
        subject_id, 
        teacher_id,
        student_name,
        class_name,
        subject_name
      } = gradeData;

      // 1. Resolve Student Name -> student_id if text name is provided
      if (student_name && (!student_id || student_id === "00000000-0000-0000-0000-000000000000")) {
        // Try to find an existing student matching this name
        const { data: existingStudent } = await supabaseAdmin
          .from("students")
          .select("id")
          .ilike("name", student_name.trim())
          .maybeSingle();

        if (existingStudent) {
          student_id = existingStudent.id;
        } else {
          // Fallback: Auto-create the student record if they don't exist yet
          const { data: newStudent, error: studentCreateErr } = await supabaseAdmin
            .from("students")
            .insert([{ 
              name: student_name.trim(),
              section: class_name || "Unassigned",
              grade: gradeData.grade_level || "Unassigned",
              school_year: gradeData.school_year || "2026-2027"
            }])
            .select("id")
            .single();

          if (studentCreateErr) throw studentCreateErr;
          student_id = newStudent.id;
        }
      }

      // 2. Resolve Class Name -> class_id and teacher_id if needed
      if (class_name && (!class_id || class_id === "00000000-0000-0000-0000-000000000000")) {
        const { data: foundClass } = await supabaseAdmin
          .from("classes")
          .select("id, teacher_id")
          .ilike("class_name", class_name.trim())
          .maybeSingle();

        if (foundClass) {
          class_id = foundClass.id;
          if (!teacher_id) teacher_id = foundClass.teacher_id;
        }
      }

      if (!teacher_id && class_id) {
        const { data: foundClassById } = await supabaseAdmin
          .from("classes")
          .select("teacher_id")
          .eq("id", class_id)
          .maybeSingle();
        if (foundClassById) teacher_id = foundClassById.teacher_id;
      }

      // 3. Resolve Subject Name -> subject_id
      if (subject_name && (!subject_id || subject_id === "00000000-0000-0000-0000-000000000000")) {
        const { data: foundSubject } = await supabaseAdmin
          .from("subjects")
          .select("id")
          .ilike("subject_name", subject_name.trim())
          .maybeSingle();

        if (foundSubject) {
          subject_id = foundSubject.id;
        }
      }

      if (!teacher_id && class_id) {
        const { data: foundAssignment } = await supabaseAdmin
          .from("subject_class_assignments")
          .select("teacher_id")
          .eq("class_id", class_id)
          .maybeSingle();
        if (foundAssignment && foundAssignment.teacher_id) teacher_id = foundAssignment.teacher_id;
      }

      if (!student_name && student_id) {
        const { data: studentRecord, error: studentFetchError } = await supabaseAdmin
          .from("students")
          .select("name")
          .eq("id", student_id)
          .maybeSingle();

        if (studentFetchError) throw studentFetchError;
        if (studentRecord && studentRecord.name) {
          student_name = studentRecord.name;
        }
      }

      if (!teacher_id) {
        const { data: fallbackTeacher, error: fallbackTeacherError } = await supabaseAdmin
          .from("teachers")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (fallbackTeacher && fallbackTeacher.id) {
          teacher_id = fallbackTeacher.id;
        } else {
          const { data: createdTeacher, error: createTeacherError } = await supabaseAdmin
            .from("teachers")
            .insert([{ first_name: 'Default', last_name: 'Teacher' }])
            .select('id')
            .single();

          if (createTeacherError) throw createTeacherError;
          teacher_id = createdTeacher.id;
        }
      }

      if (!teacher_id) {
        throw new Error('Unable to resolve teacher_id for grade creation.');
      }

      const school_year = gradeData.school_year || "2026-2027";
      const grading_period = gradeData.grading_period || "1st Semester";

      if (student_id && subject_id && class_id) {
        const { data: existingGrade, error: existingGradeError } = await supabaseAdmin
          .from('grades')
          .select('id')
          .eq('student_id', student_id)
          .eq('subject_id', subject_id)
          .eq('class_id', class_id)
          .eq('school_year', school_year)
          .eq('grading_period', grading_period)
          .maybeSingle();

        if (existingGrade && existingGrade.id) {
          throw new Error('This student already has a grade entry for this subject and section.');
        }
      }

      // 4. Clean and reconcile alternate grade properties (e.g., q1_grade vs preliminary_grade)
      const preliminary_grade = parseFloat(gradeData.preliminary_grade || gradeData.q1_grade) || 0;
      const midterm_grade = parseFloat(gradeData.midterm_grade || gradeData.q2_grade) || 0;
      const final_grade = parseFloat(gradeData.final_grade || gradeData.q3_grade) || 0;
      const fourth_period_grade = parseFloat(gradeData.fourth_period_grade || gradeData.q4_grade) || 0;

      // Calculate total average
      const average_grade = parseFloat(((preliminary_grade + midterm_grade + final_grade + fourth_period_grade) / 4).toFixed(2));
      const remarks = average_grade >= 75 ? "Passed" : "Failed";

      // 5. Construct a structured payload matching your Supabase Schema perfectly
      const finalPayload = {
        student_id,
        class_id,
        subject_id,
        teacher_id: teacher_id || null,
        preliminary_grade,
        midterm_grade,
        final_grade,
        fourth_period_grade,
        q1_grade: preliminary_grade, 
        q2_grade: midterm_grade,
        q3_grade: final_grade,
        q4_grade: fourth_period_grade,
        school_year: gradeData.school_year || "2026-2027",
        grading_period: gradeData.grading_period || "1st Semester"
      };

      // 6. Execute insert query
      const { data, error } = await supabaseAdmin
        .from("grades")
        .insert([finalPayload])
        .select();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key value')) {
          throw new Error('This student already has a grade entry for this subject and section.');
        }
        throw error;
      }
      return data[0];
    } catch (error) {
      throw new Error(`Create grade error: ${error.message}`);
    }
  },
  
  // Update grade
  async updateGrade(gradeId, updateData) {
    try {
      const allowedFields = [
        "student_id",
        "class_id",
        "subject_id",
        "teacher_id",
        "preliminary_grade",
        "midterm_grade",
        "final_grade",
        "fourth_period_grade",
        "q1_grade",
        "q2_grade",
        "q3_grade",
        "q4_grade",
        "average_grade",
        "remarks",
        "school_year",
        "grading_period",
      ];

      const payload = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          payload[key] = updateData[key];
        }
      });

      const gradeFieldsUpdated = [
        "preliminary_grade",
        "midterm_grade",
        "final_grade",
        "fourth_period_grade",
        "q1_grade",
        "q2_grade",
        "q3_grade",
        "q4_grade",
      ];

      const shouldRecalculate = gradeFieldsUpdated.some((field) =>
        Object.prototype.hasOwnProperty.call(updateData, field),
      );

      if (shouldRecalculate) {
        const { data: gradeData, error: fetchError } = await supabaseAdmin
          .from("grades")
          .select("*")
          .eq("id", gradeId)
          .single();
        if (fetchError) throw fetchError;

        const q1 = parseFloat(
          payload.preliminary_grade ?? payload.q1_grade ?? gradeData.preliminary_grade ?? gradeData.q1_grade ?? 0,
        ) || 0;
        const q2 = parseFloat(
          payload.midterm_grade ?? payload.q2_grade ?? gradeData.midterm_grade ?? gradeData.q2_grade ?? 0,
        ) || 0;
        const q3 = parseFloat(
          payload.final_grade ?? payload.q3_grade ?? gradeData.final_grade ?? gradeData.q3_grade ?? 0,
        ) || 0;
        const q4 = parseFloat(
          payload.fourth_period_grade ?? payload.q4_grade ?? gradeData.fourth_period_grade ?? gradeData.q4_grade ?? 0,
        ) || 0;

        payload.preliminary_grade = q1;
        payload.midterm_grade = q2;
        payload.final_grade = q3;
        payload.fourth_period_grade = q4;
        payload.q1_grade = q1;
        payload.q2_grade = q2;
        payload.q3_grade = q3;
        payload.q4_grade = q4;
        payload.average_grade = parseFloat(((q1 + q2 + q3 + q4) / 4).toFixed(2));
        payload.remarks = payload.average_grade >= 75 ? "Passed" : "Failed";
      }

      const { data, error } = await supabaseAdmin
        .from("grades")
        .update(payload)
        .eq("id", gradeId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Update grade error: ${error.message}`);
    }
  },

  async _populateStudentNames(gradeRecords) {
    const studentIds = Array.from(
      new Set(
        gradeRecords
          .map((record) => record.student_id)
          .filter(Boolean),
      ),
    );

    if (studentIds.length === 0) {
      return gradeRecords;
    }

    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, name")
      .in("id", studentIds);
    if (studentError) throw studentError;

    const studentMap = (students || []).reduce((acc, student) => {
      if (student?.id) acc[student.id] = student.name;
      return acc;
    }, {});

    return gradeRecords.map((record) => ({
      ...record,
      student_name: record.student_name || studentMap[record.student_id] || null,
    }));
  },

  // Delete grade
  async deleteGrade(gradeId) {
    try {
      const { error } = await supabaseAdmin
        .from("grades")
        .delete()
        .eq("id", gradeId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Delete grade error: ${error.message}`);
    }
  },
};

module.exports = gradeService;
