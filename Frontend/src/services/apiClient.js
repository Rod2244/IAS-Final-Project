import { supabase } from "./supabase";

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

export const authService = {
  async signUp(email, password, role = "student") {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      // Create user record with role
      await supabase.from("users").insert({
        id: data.user?.id,
        email,
        role,
        status: "Active",
      });

      return data;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error("Get session error:", error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },

  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  },
};

// ============================================================================
// STUDENT SERVICES
// ============================================================================

export const studentService = {
  async getAll() {
    try {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get all students error:", error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student error:", error);
      throw error;
    }
  },

  async getByLRN(lrn) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("lrn", lrn)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student by LRN error:", error);
      throw error;
    }
  },

  async create(student) {
    try {
      const { data, error } = await supabase
        .from("students")
        .insert([student])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Create student error:", error);
      throw error;
    }
  },

  async update(id, student) {
    try {
      const { data, error } = await supabase
        .from("students")
        .update(student)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update student error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete student error:", error);
      throw error;
    }
  },

  async getByGrade(grade) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("grade", grade);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get students by grade error:", error);
      throw error;
    }
  },

  async getBySection(section) {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("section", section);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get students by section error:", error);
      throw error;
    }
  },
};

// ============================================================================
// GRADE SERVICES
// ============================================================================

export const gradeService = {
  async getAll() {
    try {
      const { data, error } = await supabase.from("grades").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get all grades error:", error);
      throw error;
    }
  },

  async getByStudent(studentId) {
    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student grades error:", error);
      throw error;
    }
  },

  async getByClass(classId) {
    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("class_id", classId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get class grades error:", error);
      throw error;
    }
  },

  async create(grade) {
    try {
      // Auto-calculate average if not provided
      if (!grade.average_grade) {
        const { p, m, f, fp } = grade;
        grade.average_grade = (p + m + f + fp) / 4;
        grade.remarks = grade.average_grade >= 75 ? "Passed" : "Failed";
      }

      const { data, error } = await supabase
        .from("grades")
        .insert([grade])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Create grade error:", error);
      throw error;
    }
  },

  async update(id, grade) {
    try {
      const { data, error } = await supabase
        .from("grades")
        .update(grade)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update grade error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("grades").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete grade error:", error);
      throw error;
    }
  },
};

// ============================================================================
// ATTENDANCE SERVICES
// ============================================================================

export const attendanceService = {
  async record(studentId, classId, status, date) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .insert([
          {
            student_id: studentId,
            class_id: classId,
            status,
            attendance_date: date,
          },
        ])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Record attendance error:", error);
      throw error;
    }
  },

  async getStudentAttendance(studentId) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get student attendance error:", error);
      throw error;
    }
  },

  async getAttendanceSummary(studentId) {
    try {
      const { data, error } = await supabase
        .from("attendance_summary")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get attendance summary error:", error);
      throw error;
    }
  },

  async getByDate(date) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("attendance_date", date);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get attendance by date error:", error);
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .update(updateData)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update attendance error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete attendance error:", error);
      throw error;
    }
  },
};

// ============================================================================
// SUBJECT SERVICES
// ============================================================================

export const subjectService = {
  async getAll() {
    try {
      const { data, error } = await supabase.from("subjects").select("*");
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get all subjects error:", error);
      throw error;
    }
  },

  async getByGrade(gradeLevel) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("grade_level", gradeLevel);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get subjects by grade error:", error);
      throw error;
    }
  },

  async create(subject) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert([subject])
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Create subject error:", error);
      throw error;
    }
  },

  async update(id, subject) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .update(subject)
        .eq("id", id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Update subject error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Delete subject error:", error);
      throw error;
    }
  },
};

export default {
  authService,
  studentService,
  gradeService,
  attendanceService,
  subjectService,
};
