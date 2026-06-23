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

      // Prevent rapid duplicate sends: if an unused OTP was created very recently, skip
      const recentWindowMs = 30 * 1000; // 30 seconds
      const recentSince = new Date(Date.now() - recentWindowMs).toISOString();
      const { data: recentOtp, error: recentErr } = await supabaseAdmin
        .from('user_otps')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('used', false)
        .eq('purpose', purpose)
        .gt('created_at', recentSince)
        .limit(1)
        .maybeSingle();

      if (!recentErr && recentOtp) {
        console.log(`Skipping OTP send - recent unused OTP exists for user ${user.id}`);
        return { sent: true };
      }

      const code = generateOtpCode();
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      console.log("Generated OTP code:", code, "with hash:", codeHash, "for user:", user.email);

      // Insert the new OTP record first
      const { data: insertData, error: insertErr } = await supabaseAdmin.from("user_otps").insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
        purpose,
        used: false,
      }).select('id, created_at').limit(1).maybeSingle();

      if (insertErr || !insertData) {
        console.warn("Failed to persist OTP:", insertErr);
        // If we couldn't persist, still generate/send email to avoid blocking UX
      }

      // Ensure only the most recent unused OTP triggers an email send. This prevents
      // two near-simultaneous requests from both sending different codes.
      const { data: latestOtp, error: latestErr } = await supabaseAdmin
        .from('user_otps')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('purpose', purpose)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErr || !latestOtp) {
        // Nothing to send
        return { sent: true };
      }

      // If the inserted record is not the latest (another concurrent insert won),
      // mark this inserted one as used and skip sending an email for it.
      if (insertData && latestOtp.id !== insertData.id) {
        await supabaseAdmin.from('user_otps').update({ used: true }).eq('id', insertData.id);
        console.log(`Skipping OTP send - another concurrent OTP is newer for user ${user.id}`);
        return { sent: true };
      }

      const subject = purpose === "password_reset" ? "Password reset code" : "Your verification code";
      const html = `<p>Your ${purpose === "password_reset" ? "password reset" : "verification"} code is <strong>${code}</strong>. It expires in 10 minutes.</p>`;

      console.log("Sending email with code:", code, "for user:", user.email, "hash:", codeHash);

      try {
        await sendEmailViaBrevo(user.email, subject, html);
        console.log("Email sent successfully with code:", code);
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
      console.log("verifyOtp called with:", { email, code, purpose });
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email, otp_enabled, role")
        .ilike("email", email)
        .limit(1)
        .single();

      if (userError || !user) {
        console.log("User lookup failed:", userError);
        return { verified: false };
      }

      console.log("User found:", { id: user.id, email: user.email, otp_enabled: user.otp_enabled, role: user.role });

      if (purpose !== "password_reset" && !user.otp_enabled) {
        console.log("OTP not enabled for user");
        return { verified: false };
      }

      const codeHash = hashCode(code);
      console.log("Code hash:", codeHash);

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

      if (otpErr || !otpRow) {
        console.log("OTP lookup failed:", otpErr);
        return { verified: false };
      }

      console.log("OTP row found:", { id: otpRow.id, expires_at: otpRow.expires_at, used: otpRow.used, stored_hash: otpRow.code_hash });
      console.log("Computed hash:", codeHash);
      console.log("Hash comparison:", { match: otpRow.code_hash === codeHash, stored: otpRow.code_hash, computed: codeHash });

      if (otpRow.code_hash !== codeHash) {
        console.log("Code hash mismatch");
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

      console.log("OTP verified successfully");
      return { verified: true, user };
    } catch (err) {
      console.error("verifyOtp error", err);
      return { verified: false };
    }
  },
};

module.exports = mfaService;
