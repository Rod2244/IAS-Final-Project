const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { supabaseAdmin, supabase } = require("../config/supabase");
const auditService = require("./auditService");

// Generate a unique session token
const generateSessionToken = () => {
  return "sess_" + crypto.randomBytes(16).toString("hex");
};

// Authentication Service
const authService = {
  // Sign up a new user
  async signUp(email, password, role = "student", profileData = {}) {
    try {
      const isTeacher = role === "faculty" || role === "teacher";
      const allowedRoles = ["student", "admin"];
      const normalizedRole = isTeacher
        ? "admin"
        : allowedRoles.includes(role)
          ? role
          : "student";

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) throw error;

      const userId = data.user.id;
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user record in users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email,
          role: normalizedRole,
          status: "Active",
          password_hash: passwordHash,
          otp_enabled: true,
        })
        .select();

      if (userError) throw userError;

      // If role is faculty/teacher, also create in teachers table
      if (isTeacher) {
        const { error: teacherError } = await supabaseAdmin
          .from("teachers")
          .insert({
            user_id: userId,
            first_name: profileData.firstName || null,
            last_name: profileData.lastName || null,
            middle_name: profileData.middleInitial || null,
            employee_id: profileData.facultyId || null,
            phone_number: profileData.phoneNumber || null,
            department: profileData.department || null,
            grade_level_assignment: profileData.gradeLevelAssignment || null,
            class_assignment: profileData.classAssignment || null,
          });

        if (teacherError) throw teacherError;
      }

      // If role is student, also create in students table
      if (normalizedRole === "student") {
        const { error: studentError } = await supabaseAdmin
          .from("students")
          .insert({
            user_id: userId,
            name:
              `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() ||
              null,
            status: "Active",
          });

        if (studentError) throw studentError;
      }

      await auditService.recordEvent({
        userId,
        action: "User created",
        tableName: "users",
        recordId: userId,
        newValues: { email, role: normalizedRole },
      });

      return { user: data.user, userRecord: userData[0] };
    } catch (error) {
      throw new Error(
        "Unable to create account. Please verify your details and try again.",
      );
    }
  },

  // Sign in user
  async signIn(email, password, ipAddress = null, userAgent = null) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (userError) throw userError;

      // Generate session token and create session record
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error: sessionError } = await supabaseAdmin
        .from("sessions")
        .insert({
          user_id: data.user.id,
          token: sessionToken,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          expires_at: expiresAt.toISOString(),
          last_activity: new Date().toISOString(),
        });

      if (sessionError) {
        console.warn("Session creation warning:", sessionError);
        // Don't fail login if session creation fails, just warn
      }

      await auditService.recordEvent({
        userId: data.user.id,
        action: "User sign in (password verified)",
        tableName: "users",
        recordId: data.user.id,
        newValues: { ipAddress, userAgent },
      });

      return {
        session: data.session,
        user: data.user,
        userRole: userData.role,
        sessionToken: sessionToken,
        mustChangePassword: userData.must_change_password || false,
      };
    } catch (error) {
      throw new Error("Invalid login credentials.");
    }
  },

  // Sign out user
  async signOut(sessionToken = null) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Invalidate session record if token provided
      if (sessionToken) {
        const { error: sessionError } = await supabaseAdmin
          .from("sessions")
          .update({ expires_at: new Date().toISOString() })
          .eq("token", sessionToken);

        if (sessionError) {
          console.warn("Session invalidation warning:", sessionError);
          // Don't fail signout if session update fails
        }
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Sign out error: ${error.message}`);
    }
  },

  // Create a session record for a user (used after MFA verification)
  async createSessionForUser(userId, ipAddress = null, userAgent = null) {
    try {
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error: sessionError } = await supabaseAdmin
        .from("sessions")
        .insert({
          user_id: userId,
          token: sessionToken,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          expires_at: expiresAt.toISOString(),
          last_activity: new Date().toISOString(),
        });

      if (sessionError) {
        console.warn("Session creation warning:", sessionError);
      }

      await auditService.recordEvent({
        userId,
        action: "Session created (MFA)",
        tableName: "sessions",
        recordId: null,
      });

      return { sessionToken };
    } catch (err) {
      console.error("createSessionForUser error", err);
      return { sessionToken: null };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      throw new Error(`Get user error: ${error.message}`);
    }
  },

  // Update user password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Update password error: ${error.message}`);
    }
  },
};

module.exports = authService;
