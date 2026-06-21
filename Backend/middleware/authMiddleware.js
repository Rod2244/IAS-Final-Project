const sessionService = require("../services/sessionService");

const authMiddleware = {
  async requireAuth(req, res, next) {
    try {
      const sessionToken =
        req.cookies?.sessionToken ||
        req.headers?.authorization?.split(" ")[1] ||
        req.body?.sessionToken ||
        req.query?.sessionToken;

      if (!sessionToken) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const valid = await sessionService.validateSession(sessionToken);
      if (!valid) {
        return res.status(401).json({ error: "Invalid or expired session." });
      }

      // Refresh last activity timestamp
      await sessionService.updateLastActivity(sessionToken);

      const session = await sessionService.getSession(sessionToken);
      req.session = session;
      req.userId = session.user_id;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ error: "Unable to authenticate request." });
    }
  },
};

module.exports = authMiddleware;
