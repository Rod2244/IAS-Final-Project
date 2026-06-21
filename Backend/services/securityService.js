const { supabaseAdmin } = require("../config/supabase");

const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const securityService = {
  async getLockoutStatus(email) {
    const normalizedEmail = normalizeKey(email);
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("auth_lockouts")
      .select("failed_attempts, first_attempt_at, lockout_until")
      .eq("email", normalizedEmail)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return { isLocked: false };
    }

    if (data.lockout_until && new Date(data.lockout_until) > new Date()) {
      const unlockAt = new Date(data.lockout_until).toISOString();
      return {
        isLocked: true,
        unlockAt,
        unlockInMinutes: Math.ceil((new Date(data.lockout_until) - new Date()) / 60000),
      };
    }

    return { isLocked: false };
  },

  async recordFailedAttempt(email) {
    const normalizedEmail = normalizeKey(email);
    const now = new Date();
    const resetWindowAt = new Date(now - FAILED_ATTEMPT_WINDOW_MS).toISOString();

    const { data, error } = await supabaseAdmin
      .from("auth_lockouts")
      .select("failed_attempts, first_attempt_at, lockout_until")
      .eq("email", normalizedEmail)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    let failedAttempts = 1;
    let firstAttemptAt = now.toISOString();
    let lockoutUntil = null;

    if (data) {
      const lastAttemptAt = new Date(data.first_attempt_at);
      if (lastAttemptAt > new Date(resetWindowAt)) {
        failedAttempts = data.failed_attempts + 1;
        firstAttemptAt = data.first_attempt_at;
      }

      if (data.lockout_until && new Date(data.lockout_until) > now) {
        failedAttempts = data.failed_attempts;
        lockoutUntil = data.lockout_until;
      }
    }

    if (failedAttempts >= MAX_FAILED_ATTEMPTS && !lockoutUntil) {
      lockoutUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString();
      failedAttempts = 0;
    }

    const payload = {
      email: normalizedEmail,
      failed_attempts: failedAttempts,
      first_attempt_at: firstAttemptAt,
      lockout_until: lockoutUntil,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("auth_lockouts")
      .upsert(payload, { onConflict: ["email"] });

    if (upsertError) {
      throw upsertError;
    }

    return {
      isLocked: Boolean(lockoutUntil && new Date(lockoutUntil) > now),
      unlockAt: lockoutUntil,
      unlockInMinutes: lockoutUntil ? Math.ceil((new Date(lockoutUntil) - now) / 60000) : 0,
      attempts: failedAttempts,
    };
  },

  async resetFailedAttempts(email) {
    const normalizedEmail = normalizeKey(email);

    const { error } = await supabaseAdmin
      .from("auth_lockouts")
      .update({ failed_attempts: 0, first_attempt_at: new Date().toISOString(), lockout_until: null, updated_at: new Date().toISOString() })
      .eq("email", normalizedEmail);

    if (error) {
      throw error;
    }
  },
};

module.exports = securityService;
