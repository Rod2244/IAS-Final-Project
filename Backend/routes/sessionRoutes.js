const express = require("express");
const sessionService = require("../services/sessionService");

const router = express.Router();

// Get all active sessions for current user
router.get("/my-sessions", async (req, res) => {
  try {
    // User ID should come from auth middleware in real scenario
    const userId = req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const sessions = await sessionService.getUserSessions(userId);
    res.status(200).json({
      success: true,
      sessions: sessions.map((session) => ({
        id: session.id,
        token: session.token.substring(0, 10) + "...", // Mask token for security
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
      })),
      count: sessions.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Invalidate specific session
router.post("/invalidate", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: "Session token required" });
    }

    const result = await sessionService.invalidateSession(sessionToken);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout all sessions for current user (logout all devices)
router.post("/logout-all", async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const result = await sessionService.invalidateUserSessions(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get session statistics
router.get("/stats", async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const stats = await sessionService.getSessionStats(userId);
    res.status(200).json({
      success: true,
      ...stats,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Validate session token
router.post("/validate", async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: "Session token required" });
    }

    const isValid = await sessionService.validateSession(sessionToken);
    res.status(200).json({
      success: true,
      isValid,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Cleanup expired sessions (maintenance task)
router.post("/cleanup", async (req, res) => {
  try {
    // In production, this should be protected by admin auth middleware
    const result = await sessionService.cleanupExpiredSessions();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
