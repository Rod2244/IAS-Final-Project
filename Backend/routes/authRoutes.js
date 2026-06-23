const express = require("express");
const { BrevoClient } = require("@getbrevo/brevo");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const authService = require("../services/authService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const mfaService = require("../services/mfaService");
const { supabaseAdmin } = require("../config/supabase");

const router = express.Router();

// Helper function to get real client IP
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.ip ||
    req.connection.remoteAddress ||
    "unknown"
  );
};

// Sign up route
router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      middleInitial,
      facultyId,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const requestedRole = role || "student";
    const isTeacher =
      requestedRole === "faculty" ||
      requestedRole === "teacher" ||
      requestedRole === "admin";

    // Reject duplicate email if it already exists in users
    const { data: existingUser, error: userLookupError } = await supabaseAdmin
      .from("users")
      .select("id,email")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (!userLookupError && existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // Teacher/faculty/admin accounts require email verification first
    if (isTeacher) {
      if (!process.env.PENDING_PASSWORD_SECRET) {
        return res.status(500).json({
          error: "Pending password encryption secret is not configured.",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(process.env.PENDING_PASSWORD_SECRET, "hex"),
        iv,
      );
      let encrypted = cipher.update(password, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag().toString("hex");

      const { data: existingPending, error: pendingLookupError } =
        await supabaseAdmin
          .from("pending_registrations")
          .select("*")
          .ilike("email", email)
          .limit(1)
          .maybeSingle();

      if (pendingLookupError || !existingPending) {
        const { error: insertErr } = await supabaseAdmin
          .from("pending_registrations")
          .insert({
            email,
            password_encrypted: encrypted,
            password_nonce: iv.toString("hex"),
            password_tag: authTag,
            role: "admin",
            profile_data: {
              firstName: firstName || null,
              lastName: lastName || null,
              middleInitial: middleInitial || null,
              facultyId: facultyId || null,
            },
            verification_token: token,
            token_expires_at: tokenExpiry,
          });

        if (insertErr) {
          console.error("Insert pending registration error:", insertErr);
          return res
            .status(500)
            .json({ error: "Unable to create pending registration." });
        }
      } else {
        const { error: updateErr } = await supabaseAdmin
          .from("pending_registrations")
          .update({
            password_encrypted: encrypted,
            password_nonce: iv.toString("hex"),
            password_tag: authTag,
            profile_data: {
              firstName: firstName || null,
              lastName: lastName || null,
              middleInitial: middleInitial || null,
              facultyId: facultyId || null,
            },
            verification_token: token,
            token_expires_at: tokenExpiry,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingPending.id);

        if (updateErr) {
          console.error("Update pending registration error:", updateErr);
          return res
            .status(500)
            .json({ error: "Unable to update pending registration." });
        }
      }

      try {
        const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
        const activationUrl = `${process.env.BACKEND_BASE_URL || "http://localhost:5000"}/api/auth/verify-email?token=${token}`;

        await brevo.transactionalEmails.sendTransacEmail({
          subject: "Activate Your Teacher Account",
          sender: {
            name: "Summit Ridge Team",
            email: process.env.NO_REPLY_EMAIL || "no-reply@summitridge.edu",
          },
          to: [{ email, name: `${firstName || ""} ${lastName || ""}`.trim() }],
          htmlContent: `
            <h3>Welcome ${firstName || "Teacher"}!</h3>
            <p>Please confirm your email to activate your teacher account:</p>
            <p><a href="${activationUrl}" style="background:#22c55e;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify My Email</a></p>
            <p>This link will expire in 15 minutes.</p>
          `,
        });
      } catch (emailErr) {
        console.error("Brevo send error:", emailErr);
        await supabaseAdmin
          .from("pending_registrations")
          .delete()
          .ilike("email", email);
        return res
          .status(500)
          .json({ error: "Failed to send verification email." });
      }

      return res.status(200).json({
        success: true,
        message: "Verification link sent to your email.",
      });
    }

    const result = await authService.signUp(email, password, requestedRole, {
      firstName,
      lastName,
      middleInitial,
      facultyId,
    });
    res.status(201).json({
      success: true,
      user: result.user,
      userRecord: result.userRecord,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(400)
      .json({ error: error.message || "Unable to create account." });
  }
});

// Email verification route
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Missing token." });
    }

    const { data: pendingRow, error: pendingErr } = await supabaseAdmin
      .from("pending_registrations")
      .select("*")
      .eq("verification_token", token)
      .limit(1)
      .maybeSingle();

    if (pendingErr || !pendingRow) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    if (new Date() > new Date(pendingRow.token_expires_at)) {
      await supabaseAdmin
        .from("pending_registrations")
        .delete()
        .eq("id", pendingRow.id);
      return res
        .status(400)
        .send("This verification link has expired. Please sign up again.");
    }

    const { data: existingUserAfter, error: existingUserAfterErr } =
      await supabaseAdmin
        .from("users")
        .select("id")
        .ilike("email", pendingRow.email)
        .limit(1)
        .maybeSingle();

    if (!existingUserAfterErr && existingUserAfter) {
      await supabaseAdmin
        .from("pending_registrations")
        .delete()
        .eq("id", pendingRow.id);
      return res.redirect(
        `${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/login?already=true`,
      );
    }

    if (!process.env.PENDING_PASSWORD_SECRET) {
      return res.status(500).json({
        error: "Pending password encryption secret is not configured.",
      });
    }

    const key = Buffer.from(process.env.PENDING_PASSWORD_SECRET, "hex");
    const iv = Buffer.from(pendingRow.password_nonce, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(pendingRow.password_tag, "hex"));
    let decrypted = decipher.update(
      pendingRow.password_encrypted,
      "hex",
      "utf8",
    );
    decrypted += decipher.final("utf8");

    try {
      await authService.signUp(
        pendingRow.email,
        decrypted,
        pendingRow.role || "admin",
        {
          firstName: pendingRow.profile_data?.firstName,
          lastName: pendingRow.profile_data?.lastName,
          middleInitial: pendingRow.profile_data?.middleInitial,
          facultyId: pendingRow.profile_data?.facultyId,
        },
      );

      await supabaseAdmin
        .from("pending_registrations")
        .delete()
        .eq("id", pendingRow.id);
      return res.redirect(
        `${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/login?verified=true`,
      );
    } catch (createErr) {
      console.error("Error creating account after verification:", createErr);
      return res
        .status(500)
        .send("Failed to create account. Please contact support.");
    }
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Sign in route
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;

    const lockStatus = await securityService.getLockoutStatus(email);
    if (lockStatus.isLocked) {
      return res.status(429).json({
        error:
          "Account temporarily locked due to repeated failed login attempts. Please try again later.",
      });
    }

    const result = await authService.signIn(
      email,
      password,
      ipAddress,
      userAgent,
    );
    await securityService.resetFailedAttempts(email);

    // Check if user has OTP enabled
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id, email, otp_enabled, role")
      .ilike("email", email)
      .limit(1)
      .single();

    if (!userErr && userRow && userRow.otp_enabled) {
      // Send OTP and return mfaRequired to client
      await mfaService.sendOtp(userRow.email);
      await auditService.recordEvent({
        userId: userRow.id,
        action: "MFA required - code sent",
        tableName: "users",
        recordId: userRow.id,
      });

      return res.status(200).json({
        success: true,
        mfaRequired: true,
        email: userRow.email,
        userRole: userRow.role,
        mustChangePassword: result.mustChangePassword || false,
        user: result.user,
      });
    }

    // No MFA required: set session cookie and return success
    await auditService.recordEvent({
      userId: result.user.id,
      action: "Successful sign in",
      tableName: "users",
      recordId: result.user.id,
      newValues: { ipAddress, userAgent },
    });

    res.cookie("sessionToken", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      success: true,
      session: result.session,
      user: result.user,
      userRole: result.userRole,
      sessionToken: result.sessionToken,
    });
  } catch (error) {
    const lockResult = await securityService.recordFailedAttempt(
      req.body.email,
    );
    await auditService.recordEvent({
      action: "Failed sign in attempt",
      tableName: "users",
      recordId: null,
      newValues: {
        email: req.body.email,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || null,
        locked: lockResult.isLocked,
        attempts: lockResult.attempts,
      },
    });

    const errorMessage = lockResult.isLocked
      ? "Account temporarily locked due to repeated failed login attempts. Please try again later."
      : "Invalid login credentials. Please try again.";

    res.status(401).json({ error: errorMessage });
  }
});

// Sign out route
router.post("/signout", async (req, res) => {
  try {
    const { sessionToken } = req.body;
    const result = await authService.signOut(sessionToken);
    res.clearCookie("sessionToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const user = await authService.getCurrentUser();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update password
router.post("/update-password", async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "New password required" });
    }

    const result = await authService.updatePassword(newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password route (used when must_change_password flag is set on first login)
router.post("/change-password", async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const ipAddress = getClientIp(req);

    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ error: "User ID and new password required" });
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

    // Update Supabase Auth password
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      },
    );

    if (authError) throw authError;

    // Update bcrypt hash in users table
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        password_hash: passwordHash,
        must_change_password: false, // Clear the flag
      })
      .eq("id", userId);

    if (userError) throw userError;

    // Invalidate all other sessions for this user (force logout from other sessions)
    const { error: sessionError } = await supabaseAdmin
      .from("sessions")
      .update({ expires_at: new Date().toISOString() })
      .eq("user_id", userId)
      .neq("token", "");

    if (sessionError) {
      console.warn("Session invalidation warning:", sessionError);
      // Don't fail password change if session invalidation fails
    }

    // Audit log
    await auditService.recordEvent({
      userId,
      action: "User changed password (initial login)",
      tableName: "users",
      recordId: userId,
      newValues: { mustChangePassword: false, ipAddress },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
