const { supabaseAdmin } = require("../config/supabase");

// Attendance Service
const attendanceService = {
  // Record attendance
  async recordAttendance(attendanceData) {
    try {
      const { data, error } = await supabaseAdmin
        .from("attendance")
        .insert([attendanceData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Record attendance error: ${error.message}`);
    }
  },

  // Get student attendance
  async getStudentAttendance(studentId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get student attendance error: ${error.message}`);
    }
  },

  // Get attendance summary
  async getAttendanceSummary(studentId) {
    try {
      const { data, error } = await supabaseAdmin
        .from("attendance_summary")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get attendance summary error: ${error.message}`);
    }
  },

  // Get attendance by date
  async getAttendanceByDate(date) {
    try {
      const { data, error } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("attendance_date", date);
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Get attendance by date error: ${error.message}`);
    }
  },

  // Update attendance
  async updateAttendance(attendanceId, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from("attendance")
        .update(updateData)
        .eq("id", attendanceId)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      throw new Error(`Update attendance error: ${error.message}`);
    }
  },

  // Delete attendance
  async deleteAttendance(attendanceId) {
    try {
      const { error } = await supabaseAdmin
        .from("attendance")
        .delete()
        .eq("id", attendanceId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Delete attendance error: ${error.message}`);
    }
  },
};

module.exports = attendanceService;
