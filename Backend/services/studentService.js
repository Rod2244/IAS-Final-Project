const { supabaseAdmin } = require("../config/supabase");

// Student Service
const studentService = {
  // Get all students
  async getAllStudents() {
    try {
      const { data, error } = await supabaseAdmin.from("students").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get students error: ${error.message}`);
    }
  },

  // Get student by ID
  async getStudentById(studentId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get student error: ${error.message}`);
    }
  },

  // Get student by LRN
  async getStudentByLRN(lrn) {
    try {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("lrn", lrn)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get student by LRN error: ${error.message}`);
    }
  },

  // Create new student
  async createStudent(studentData) {
    try {
      const { data, error } = await supabaseAdmin
        .from("students")
        .insert([studentData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Create student error: ${error.message}`);
    }
  },

  // Update student
  async updateStudent(studentId, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from("students")
        .update(updateData)
        .eq("id", studentId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Update student error: ${error.message}`);
    }
  },

  // Delete student
  async deleteStudent(studentId) {
    try {
      const { error } = await supabaseAdmin
        .from("students")
        .delete()
        .eq("id", studentId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Delete student error: ${error.message}`);
    }
  },

  // Get students by grade
  async getStudentsByGrade(grade) {
    try {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("grade", grade);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get students by grade error: ${error.message}`);
    }
  },

  // Get students by section
  async getStudentsBySection(section) {
    try {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("section", section);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get students by section error: ${error.message}`);
    }
  },
};

module.exports = studentService;
