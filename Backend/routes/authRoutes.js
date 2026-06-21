const express = require("express");
const authService = require("../services/authService");

const router = express.Router();

// Sign up route
router.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await authService.signUp(email, password, role || "student");
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

    const result = await authService.signIn(email, password);
    res.status(200).json({
      success: true,
      session: result.session,
      user: result.user,
      userRole: result.userRole,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sign out route
router.post("/signout", async (req, res) => {
  try {
    const result = await authService.signOut();
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
