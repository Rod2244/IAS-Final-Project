const express = require("express");
const mfaService = require("../services/mfaService");
const authService = require("../services/authService");
const auditService = require("../services/auditService");
const securityService = require("../services/securityService");

const router = express.Router();

// Send OTP to user's email (idempotent response)
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    await mfaService.sendOtp(email);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Unable to send code" });
  }
});

// Verify OTP and finalize session
router.post("/verify", async (req, res) => {
  try {
    const { email, code, ipAddress, userAgent } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code required" });

    const verify = await mfaService.verifyOtp(email, code);
    if (!verify.verified) return res.status(401).json({ error: "Invalid or expired code" });

    // Create session for verified user
    const { sessionToken } = await authService.createSessionForUser(verify.user.id, ipAddress, userAgent);

    res.cookie("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    await auditService.recordEvent({
      userId: verify.user.id,
      action: "MFA verified - session created",
      tableName: "user_otps",
      recordId: null,
    });

    console.log("MFA verify success, returning:", { success: true, userRole: verify.user.role, userId: verify.user.id });
    res.status(200).json({ success: true, userRole: verify.user.role });
  } catch (err) {
    console.error("MFA verify error", err);
    res.status(500).json({ error: "Unable to verify code" });
  }
});

module.exports = router;
