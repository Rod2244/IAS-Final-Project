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
  async createGrade(gradeData) {
    try {
      // Calculate average if not provided
      if (
        !gradeData.average_grade &&
        gradeData.preliminary_grade &&
        gradeData.midterm_grade &&
        gradeData.final_grade &&
        gradeData.fourth_period_grade
      ) {
        gradeData.average_grade =
          (gradeData.preliminary_grade +
            gradeData.midterm_grade +
            gradeData.final_grade +
            gradeData.fourth_period_grade) /
          4;
      }

      // Determine remarks
      if (!gradeData.remarks) {
        gradeData.remarks = gradeData.average_grade >= 75 ? "Passed" : "Failed";
      }

      const { data, error } = await supabaseAdmin
        .from("grades")
        .insert([gradeData])
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
