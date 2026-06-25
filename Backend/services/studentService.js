const bcrypt = require("bcryptjs");
const https = require("https");
const { supabaseAdmin } = require("../config/supabase");
const auditService = require("./auditService");

const sendEmailViaBrevo = (toEmail, subject, htmlContent) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return reject(new Error("Brevo API key not configured"));

    const payload = JSON.stringify({
      sender: {
        name: process.env.MAIL_FROM_NAME || "NoReply",
        email: process.env.MAIL_FROM_EMAIL || "noreply@example.com",
      },
      to: [{ email: toEmail }],
      subject,
      htmlContent,
    });

    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "api-key": apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
        return reject(
          new Error(`Brevo send failed: ${res.statusCode} ${data}`),
        );
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

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
      const { data: student, error } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();
      if (error) throw error;

      const passwordValue =
        student?.temporary_password || student?.password || "";

      return {
        ...student,
        password: passwordValue,
      };
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
  async sendTemporaryPasswordEmail({ email, name, tempPassword }) {
    try {
      if (!email || !tempPassword) {
        throw new Error("Email and temporary password are required");
      }

      await sendEmailViaBrevo(
        email,
        "Your temporary student portal password",
        `<p>Hello ${name || "student"},</p>
         <p>Your temporary student portal password is <strong>${tempPassword}</strong>.</p>
         <p>You will be required to change it on your first login.</p>`,
      );

      return { sent: true };
    } catch (error) {
      throw new Error(`Send temporary password email error: ${error.message}`);
    }
  },

  async createStudentWithAccount(studentData) {
    try {
      const {
        email,
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

      if (!email) {
        throw new Error("Email is required");
      }

      const tempPassword = require("crypto")
        .randomBytes(8)
        .toString("base64")
        .substring(0, 12);

      console.log("createStudentWithAccount called with:", {
        email,
        passwordLength: tempPassword.length,
        name,
      });

      // Create Supabase auth user
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
        });

      if (authError) {
        console.log("Supabase auth user creation error:", authError);
        throw authError;
      }

      console.log("Supabase auth user created successfully:", {
        userId: authData.user.id,
        email,
      });

      const userId = authData.user.id;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

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

      try {
        await sendEmailViaBrevo(
          email,
          "Your temporary student portal password",
          `<p>Hello ${name || "student"},</p>
           <p>Your temporary student portal password is <strong>${tempPassword}</strong>.</p>
           <p>You will be required to change it on your first login.</p>`,
        );
        console.log("Temporary password email sent to:", email);
      } catch (emailErr) {
        console.warn(
          "Temporary password email send failed:",
          emailErr.message || emailErr,
        );
      }

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
        temporaryPassword: tempPassword, // Return temp password to display to admin
      };
    } catch (error) {
      throw new Error(`Create student with account error: ${error.message}`);
    }
  },
};

module.exports = studentService;
