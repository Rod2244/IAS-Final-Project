const crypto = require("crypto");
const https = require("https");
const { supabaseAdmin } = require("../config/supabase");
const auditService = require("./auditService");

const BREVO_API_HOST = "api.brevo.com";
const BREVO_API_PATH = "/v3/smtp/email";

const sendEmailViaBrevo = (toEmail, subject, htmlContent) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return reject(new Error("Brevo API key not configured"));

    const payload = JSON.stringify({
      sender: { name: process.env.MAIL_FROM_NAME || "NoReply", email: process.env.MAIL_FROM_EMAIL || "noreply@example.com" },
      to: [{ email: toEmail }],
      subject,
      htmlContent,
    });

    const options = {
      hostname: BREVO_API_HOST,
      path: BREVO_API_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "api-key": apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
        return reject(new Error(`Brevo send failed: ${res.statusCode} ${data}`));
      });
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
};

const generateOtpCode = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
};

const hashCode = (code) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

const mfaService = {
  // Send OTP to user's email if user exists and otp_enabled, or for reset flows
  async sendOtp(email, purpose = "mfa") {
    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email, otp_enabled")
        .ilike("email", email)
        .limit(1)
        .single();

      if (userError || !user) {
        // Do not reveal whether the email exists — behave as success
        return { sent: true };
      }

      if (purpose !== "password_reset" && !user.otp_enabled) {
        return { sent: true };
      }

      const code = generateOtpCode();
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Invalidate any previous unused OTPs for this user and purpose before inserting a new one
      await supabaseAdmin
        .from("user_otps")
        .update({ used: true })
        .eq("user_id", user.id)
        .eq("purpose", purpose)
        .eq("used", false);

      const { error: insertErr } = await supabaseAdmin.from("user_otps").insert({
        user_id: user.id,
        purpose,
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
        purpose,
      });

      if (insertErr) {
        console.warn("Failed to persist OTP:", insertErr);
        // Still attempt to send, but record failure
      }

      const subject = purpose === "password_reset" ? "Password reset code" : "Your verification code";
      const html = `<p>Your ${purpose === "password_reset" ? "password reset" : "verification"} code is <strong>${code}</strong>. It expires in 5 minutes.</p>`;

      try {
        await sendEmailViaBrevo(user.email, subject, html);
      } catch (emailErr) {
        console.warn("Brevo send error:", emailErr.message || emailErr);
        // Don't expose to client
      }

      await auditService.recordEvent({
        userId: user.id,
        action: "MFA code sent",
        tableName: "user_otps",
        recordId: null,
        newValues: { expiresAt },
      });

      return { sent: true };
    } catch (err) {
      console.error("sendOtp error", err);
      return { sent: true };
    }
  },

  // Verify OTP for email; returns user object on success
  async verifyOtp(email, code, purpose = "mfa") {
    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email, otp_enabled, role")
        .ilike("email", email)
        .limit(1)
        .single();

      if (userError || !user) {
        return { verified: false };
      }

      if (purpose !== "password_reset" && !user.otp_enabled) return { verified: false };

      const codeHash = hashCode(code);

      const { data: otpRow, error: otpErr } = await supabaseAdmin
        .from("user_otps")
        .select("id, code_hash, expires_at, used")
        .eq("user_id", user.id)
        .eq("used", false)
        .eq("purpose", purpose)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpErr || !otpRow) return { verified: false };

      if (otpRow.code_hash !== codeHash) {
        return { verified: false };
      }

      // Mark used
      await supabaseAdmin.from("user_otps").update({ used: true }).eq("id", otpRow.id);

      await auditService.recordEvent({
        userId: user.id,
        action: "MFA code verified",
        tableName: "user_otps",
        recordId: otpRow.id,
      });

      return { verified: true, user };
    } catch (err) {
      console.error("verifyOtp error", err);
      return { verified: false };
    }
  },
};

module.exports = mfaService;
