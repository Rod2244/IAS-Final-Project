const bcrypt = require("bcryptjs");
const { supabaseAdmin } = require("../config/supabase");
const auditService = require("./auditService");

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

  // Create student with auth account (admin creates account with temporary password)
  async createStudentWithAccount(studentData) {
    try {
      const {
        email,
        password,
        name,
        lrn,
        grade,
        className,
        dateOfBirth,
        gender,
        address,
        parentName,
        parentContact,
        ...otherData
      } = studentData;

      console.log("createStudentWithAccount called with:", { email, password, passwordLength: password?.length, name });

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Create Supabase auth user
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authError) {
        console.log("Supabase auth user creation error:", authError);
        throw authError;
      }

      console.log("Supabase auth user created successfully:", { userId: authData.user.id, email });

      const userId = authData.user.id;
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user record with must_change_password flag set to true
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email,
          role: "student",
          status: "Active",
          password_hash: passwordHash,
          otp_enabled: true,
          must_change_password: true, // Force password change on first login
        })
        .select();

      if (userError) throw userError;

      // Create student record
      const { data: studentRecord, error: studentError } = await supabaseAdmin
        .from("students")
        .insert({
          user_id: userId,
          name: name || null,
          lrn: lrn || null,
          grade: grade || null,
          section: className || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          address: address || null,
          parent_name: parentName || null,
          parent_contact: parentContact || null,
          status: "Active",
          ...otherData,
        })
        .select();

      if (studentError) throw studentError;

      // Audit log
      await auditService.recordEvent({
        userId: null,
        action: "Admin created student account",
        tableName: "students",
        recordId: studentRecord[0].id,
        newValues: { email, name, lrn, mustChangePassword: true },
      });

      return {
        success: true,
        student: studentRecord[0],
        temporaryPassword: password, // Return temp password to display to admin
      };
    } catch (error) {
      throw new Error(`Create student with account error: ${error.message}`);
    }
  },
};

module.exports = studentService;
