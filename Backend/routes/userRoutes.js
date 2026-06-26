const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const bcrypt = require("bcryptjs");
const auditService = require("../services/auditService");

const router = express.Router();

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const sessionToken =
      req.cookies?.sessionToken ||
      req.headers?.["x-session-token"] ||
      req.headers?.authorization?.split(" ")[1];

    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify session
    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionRow?.user_id) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = sessionRow.user_id;
    const {
      firstName,
      lastName,
      middleName,
      phoneNumber,
      department,
      gradeLevelAssignment,
      classAssignment,
    } = req.body;

    // Get user role
    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Update based on role
    if (userRow.role === "admin" || userRow.role === "teacher" || userRow.role === "faculty") {
      // Check if teacher record exists
      const { data: teacherRow, error: teacherCheckError } = await supabaseAdmin
        .from("teachers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (teacherCheckError) throw teacherCheckError;

      const teacherData = {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        phone_number: phoneNumber,
        department,
        grade_level_assignment: gradeLevelAssignment,
        class_assignment: classAssignment,
      };

      let result;
      if (teacherRow) {
        // Update existing teacher record
        result = await supabaseAdmin
          .from("teachers")
          .update(teacherData)
          .eq("user_id", userId)
          .select();
      } else {
        // Create new teacher record
        result = await supabaseAdmin
          .from("teachers")
          .insert({ user_id: userId, ...teacherData })
          .select();
      }

      if (result.error) throw result.error;

      // Handle schedule data if provided
      const teacherId = result.data?.[0]?.id || teacherRow?.id;
      if (req.body.schedule && Array.isArray(req.body.schedule) && teacherId) {
        // Delete existing schedule for this teacher
        await supabaseAdmin
          .from("teacher_schedule")
          .delete()
          .eq("teacher_id", teacherId);

        // Insert new schedule items
        const scheduleItems = req.body.schedule
          .filter(item => item.subject && item.section) // Only add valid items
          .map(item => ({
            teacher_id: teacherId,
            subject_code: item.code || null,
            subject_name: item.subject,
            class_section: item.section,
            day_of_week: item.time?.split(' ')[0] || 'Mon', // Extract day from time string
            start_time: item.time?.split(' - ')[1]?.split(' ')[1] || '08:00', // Extract start time
            end_time: item.time?.split(' - ')[1]?.split(' - ')[1] || '10:00', // Extract end time
            classroom_location: null,
          }));

        if (scheduleItems.length > 0) {
          const { error: scheduleError } = await supabaseAdmin
            .from("teacher_schedule")
            .insert(scheduleItems);

          if (scheduleError) console.warn("Schedule save warning:", scheduleError);
        }
      }

      await auditService.recordEvent({
        userId,
        action: "Profile updated",
        tableName: "teachers",
        recordId: result.data?.[0]?.id || userId,
        newValues: teacherData,
      });
    } else if (userRow.role === "student") {
      // Update student record
      const { data: studentRow, error: studentCheckError } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (studentCheckError) throw studentCheckError;

      const studentData = {
        name: `${firstName || ""} ${lastName || ""}`.trim(),
        phone_contact: phoneNumber,
      };

      let result;
      if (studentRow) {
        result = await supabaseAdmin
          .from("students")
          .update(studentData)
          .eq("user_id", userId)
          .select();
      } else {
        result = await supabaseAdmin
          .from("students")
          .insert({ user_id: userId, ...studentData })
          .select();
      }

      if (result.error) throw result.error;

      await auditService.recordEvent({
        userId,
        action: "Profile updated",
        tableName: "students",
        recordId: result.data?.[0]?.id || userId,
        newValues: studentData,
      });
    }

    res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

// Update password
router.put("/password", async (req, res) => {
  try {
    const sessionToken =
      req.cookies?.sessionToken ||
      req.headers?.["x-session-token"] ||
      req.headers?.authorization?.split(" ")[1];

    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify session
    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionRow?.user_id) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = sessionRow.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters with uppercase, lowercase, number, and symbol",
      });
    }

    // Get current user
    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userRow.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update Supabase Auth password
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (authError) throw authError;

    // Update bcrypt hash in users table
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (userUpdateError) throw userUpdateError;

    // Invalidate all other sessions
    await supabaseAdmin
      .from("sessions")
      .update({ expires_at: new Date().toISOString() })
      .eq("user_id", userId)
      .neq("token", sessionToken);

    await auditService.recordEvent({
      userId,
      action: "Password updated",
      tableName: "users",
      recordId: userId,
    });

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: error.message || "Failed to update password" });
  }
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const sessionToken =
      req.cookies?.sessionToken ||
      req.headers?.["x-session-token"] ||
      req.headers?.authorization?.split(" ")[1];

    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify session
    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionRow?.user_id) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = sessionRow.user_id;

    // Get user data
    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, status")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    let profile = { ...userRow };

    // Get role-specific profile data
    if (userRow.role === "admin" || userRow.role === "teacher" || userRow.role === "faculty") {
      const { data: teacherRow, error: teacherError } = await supabaseAdmin
        .from("teachers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!teacherError && teacherRow) {
        profile = {
          ...profile,
          ...teacherRow,
          firstName: teacherRow.first_name,
          lastName: teacherRow.last_name,
          middleName: teacherRow.middle_name,
          employeeId: teacherRow.employee_id,
          phoneNumber: teacherRow.phone_number,
          gradeLevelAssignment: teacherRow.grade_level_assignment,
          classAssignment: teacherRow.class_assignment,
        };

        // Load teacher schedule
        const { data: scheduleData, error: scheduleError } = await supabaseAdmin
          .from("teacher_schedule")
          .select("*")
          .eq("teacher_id", teacherRow.id);

        if (!scheduleError && scheduleData) {
          profile.schedule = scheduleData.map(item => ({
            code: item.subject_code,
            subject: item.subject_name,
            section: item.class_section,
            time: `${item.day_of_week} ${item.start_time} - ${item.end_time}`,
          }));
        }
      }
    } else if (userRow.role === "student") {
      const { data: studentRow, error: studentError } = await supabaseAdmin
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!studentError && studentRow) {
        profile = {
          ...profile,
          ...studentRow,
          name: studentRow.name,
          grade: studentRow.grade,
          section: studentRow.section,
        };
      }
    }

    // Get notification preferences
    const { data: notificationRow, error: notificationError } = await supabaseAdmin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!notificationError && notificationRow) {
      profile.notificationPreferences = notificationRow;
    } else {
      // Default preferences
      profile.notificationPreferences = {
        emailNotifications: true,
        gradeReminders: true,
        attendanceAlerts: true,
        systemUpdates: false,
      };
    }

    res.status(200).json({ success: true, user: profile });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: error.message || "Failed to get profile" });
  }
});

// Update notification preferences
router.put("/notifications", async (req, res) => {
  try {
    const sessionToken =
      req.cookies?.sessionToken ||
      req.headers?.["x-session-token"] ||
      req.headers?.authorization?.split(" ")[1];

    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify session
    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionRow?.user_id) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const userId = sessionRow.user_id;
    const { emailNotifications, gradeReminders, attendanceAlerts, systemUpdates } = req.body;

    // Check if notification preferences exist
    const { data: existingRow, error: checkError } = await supabaseAdmin
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) throw checkError;

    const preferences = {
      email_notifications: emailNotifications,
      grade_reminders: gradeReminders,
      attendance_alerts: attendanceAlerts,
      system_updates: systemUpdates,
    };

    if (existingRow) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from("notification_preferences")
        .update(preferences)
        .eq("user_id", userId);

      if (updateError) throw updateError;
    } else {
      // Create new
      const { error: insertError } = await supabaseAdmin
        .from("notification_preferences")
        .insert({ user_id: userId, ...preferences });

      if (insertError) throw insertError;
    }

    await auditService.recordEvent({
      userId,
      action: "Notification preferences updated",
      tableName: "notification_preferences",
      recordId: userId,
      newValues: preferences,
    });

    res.status(200).json({ success: true, message: "Notification preferences updated" });
  } catch (error) {
    console.error("Update notifications error:", error);
    res.status(500).json({ error: error.message || "Failed to update notification preferences" });
  }
});

module.exports = router;
