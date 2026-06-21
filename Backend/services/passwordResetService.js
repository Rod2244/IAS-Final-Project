const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const mfaService = require("./mfaService");
const auditService = require("./auditService");

const hashCode = (code) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

const passwordResetService = {
  async sendResetOtp(email) {
    return mfaService.sendOtp(email, "password_reset");
  },

  async verifyResetOtp(email, code) {
    return mfaService.verifyOtp(email, code, "password_reset");
  },

  async completeReset(email, code, newPassword) {
    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .ilike("email", email)
      .limit(1)
      .single();

    if (userError || !user) {
      return { success: false };
    }

    // Verify the OTP was already verified (marked as used) in the verify step
    const codeHash = hashCode(code);
    const { data: otpRow, error: otpErr } = await supabaseAdmin
      .from("user_otps")
      .select("id, code_hash, used")
      .eq("user_id", user.id)
      .eq("purpose", "password_reset")
      .eq("used", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpErr || !otpRow || otpRow.code_hash !== codeHash) {
      return { success: false };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const userId = user.id;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (authError) {
      console.error("Password reset supabase admin error", authError);
      return { success: false };
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (updateError) {
      console.error("Password reset users table update error", updateError);
      return { success: false };
    }

    await auditService.recordEvent({
      userId,
      action: "Password reset completed",
      tableName: "users",
      recordId: userId,
    });

    return { success: true };
  },
};

module.exports = passwordResetService;
