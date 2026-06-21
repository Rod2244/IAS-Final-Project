const express = require("express");
const passwordResetService = require("../services/passwordResetService");
const auditService = require("../services/auditService");

const router = express.Router();

router.post("/request", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    await passwordResetService.sendResetOtp(email);
    res.status(200).json({ success: true, message: "If an account exists, a reset code has been sent." });
  } catch (err) {
    console.error("Password reset request error", err);
    res.status(500).json({ error: "Unable to send password reset code." });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const verify = await passwordResetService.verifyResetOtp(email, code);
    if (!verify.verified) {
      return res.status(401).json({ success: false, error: "Invalid or expired reset code." });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Password reset verify error", err);
    res.status(500).json({ error: "Unable to verify reset code." });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code, and new password are required." });
    }

    const result = await passwordResetService.completeReset(email, code, newPassword);
    if (!result.success) {
      return res.status(401).json({ success: false, error: "Unable to reset password. Please verify the code and try again." });
    }

    res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Password reset complete error", err);
    res.status(500).json({ error: "Unable to complete password reset." });
  }
});

module.exports = router;
