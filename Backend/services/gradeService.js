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

  // Get grades by student
  async getGradesByStudent(studentId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("grades")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
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
      return data;
    } catch (error) {
      throw new Error(`Get class grades error: ${error.message}`);
    }
  },

  // Create grade
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

      // 2. Resolve Class Name -> class_id
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
        q1_grade: preliminary_grade, // populating both to stay safe
        q2_grade: midterm_grade,
        q3_grade: final_grade,
        q4_grade: fourth_period_grade,
        average_grade,
        remarks,
        school_year: gradeData.school_year || "2026-2027",
        grading_period: gradeData.grading_period || "1st Semester"
      };

      // 6. Execute insert query
      const { data, error } = await supabaseAdmin
        .from("grades")
        .insert([finalPayload])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Create grade error: ${error.message}`);
    }
  },
  
  // Update grade
  async updateGrade(gradeId, updateData) {
    try {
      // Recalculate average if grades were updated
      if (
        updateData.preliminary_grade ||
        updateData.midterm_grade ||
        updateData.final_grade ||
        updateData.fourth_period_grade
      ) {
        const { data: gradeData } = await supabaseAdmin
          .from("grades")
          .select("*")
          .eq("id", gradeId)
          .single();

        const p = updateData.preliminary_grade || gradeData.preliminary_grade;
        const m = updateData.midterm_grade || gradeData.midterm_grade;
        const f = updateData.final_grade || gradeData.final_grade;
        const fp =
          updateData.fourth_period_grade || gradeData.fourth_period_grade;

        updateData.average_grade = (p + m + f + fp) / 4;
        updateData.remarks =
          updateData.average_grade >= 75 ? "Passed" : "Failed";
      }

      const { data, error } = await supabaseAdmin
        .from("grades")
        .update(updateData)
        .eq("id", gradeId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Update grade error: ${error.message}`);
    }
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
