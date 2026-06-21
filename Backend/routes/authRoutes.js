const express = require("express");
const authService = require("../services/authService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");

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
    const { email, password, role, firstName, lastName, middleInitial, facultyId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const requestedRole = role || "student";
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
    res.status(400).json({ error: error.message });
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
        error: "Account temporarily locked due to repeated failed login attempts. Please try again later.",
      });
    }

    const result = await authService.signIn(email, password, ipAddress, userAgent);
    await securityService.resetFailedAttempts(email);

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
    const lockResult = await securityService.recordFailedAttempt(req.body.email);
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

module.exports = router;
