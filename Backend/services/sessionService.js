const { supabaseAdmin, supabase } = require("../config/supabase");

// Session Management Service
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

const sessionService = {
  // Get all active sessions for a user
  async getUserSessions(userId) {
    try {
      const now = new Date();
      const { data, error } = await supabaseAdmin
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", now.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Get user sessions error: ${error.message}`);
    }
  },

  // Get session by token
  async getSession(sessionToken) {
    try {
      const now = new Date();
      const { data, error } = await supabaseAdmin
        .from("sessions")
        .select("*, last_activity")
        .eq("token", sessionToken)
        .gt("expires_at", now.toISOString())
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    } catch (error) {
      throw new Error(`Get session error: ${error.message}`);
    }
  },

  // Validate session token
  async validateSession(sessionToken) {
    try {
      const session = await this.getSession(sessionToken);
      if (!session) return false;

      // Check inactivity timeout
      if (session.last_activity) {
        const last = new Date(session.last_activity).getTime();
        const now = Date.now();
        if (now - last > IDLE_TIMEOUT_MS) {
          // Invalidate session due to inactivity
          await this.invalidateSession(sessionToken);
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // Update last activity timestamp for a session
  async updateLastActivity(sessionToken) {
    try {
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("sessions")
        .update({ last_activity: now })
        .eq("token", sessionToken);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Update last activity error: ${error.message}`);
    }
  },

  // Invalidate specific session
  async invalidateSession(sessionToken) {
    try {
      const { error } = await supabaseAdmin
        .from("sessions")
        .update({ expires_at: new Date().toISOString() })
        .eq("token", sessionToken);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Invalidate session error: ${error.message}`);
    }
  },

  // Invalidate all sessions for a user (logout all devices)
  async invalidateUserSessions(userId) {
    try {
      const { error } = await supabaseAdmin
        .from("sessions")
        .update({ expires_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) throw error;
      return { success: true, message: "All sessions invalidated" };
    } catch (error) {
      throw new Error(`Invalidate user sessions error: ${error.message}`);
    }
  },

  // Clean up expired sessions (maintenance task)
  async cleanupExpiredSessions() {
    try {
      const now = new Date();
      const { data, error } = await supabaseAdmin
        .from("sessions")
        .delete()
        .lt("expires_at", now.toISOString());

      if (error) throw error;
      return { success: true, message: "Expired sessions cleaned up" };
    } catch (error) {
      throw new Error(`Cleanup expired sessions error: ${error.message}`);
    }
  },

  // Get session statistics (active sessions count)
  async getSessionStats(userId = null) {
    try {
      const now = new Date();
      let query = supabaseAdmin
        .from("sessions")
        .select("*", { count: "exact" })
        .gt("expires_at", now.toISOString());

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { count, error } = await query;
      if (error) throw error;

      return { totalActiveSessions: count || 0 };
    } catch (error) {
      throw new Error(`Get session stats error: ${error.message}`);
    }
  },
};

module.exports = sessionService;
