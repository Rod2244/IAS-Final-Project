# Auth / MFA Test Plan

Date: 2026-06-23

This test plan covers the newly implemented authentication and MFA improvements.

## 1. Teacher/Faculty Signup Verification Flow

### Objective
Verify that teacher/faculty/admin accounts are created only after email verification.

### Steps
1. Open the frontend signup form.
2. Select the `Faculty/Prof` role and complete the signup fields.
3. Submit the signup form.

### Expected results
- A modal appears with a message telling the user that an activation email was sent.
- No immediate redirect to dashboard occurs.
- In the backend, a new `pending_registrations` row is created with `verification_token` and encrypted password fields.
- The user receives a verification email containing a link to `/api/auth/verify-email?token=...`.

### Verification
1. Click the verification link in the email in a private/incognito browser session.
2. Ensure that the backend creates the actual user in `users` (and `teachers` if applicable).
3. Confirm the browser redirects to the login page with `?verified=true`.
4. Confirm that the pending registration row has been deleted.

## 2. MFA OTP Send Deduplication

### Objective
Confirm that only a single OTP email is sent when MFA is triggered once, and that concurrent resend attempts do not produce multiple emails.

### Steps
1. Sign in with a user account that requires MFA.
2. Trigger the MFA flow.
3. Observe whether the OTP modal appears.
4. Immediately click the `Resend Code` button once or twice.
5. Optionally inspect the email inbox for the number of OTP emails.

### Expected results
- Only one OTP email is sent for the initial MFA challenge.
- If `Resend Code` is pressed rapidly, the backend suppresses duplicate sends and only sends one email for the most recent valid OTP.
- The resend button shows a loading spinner while the request is in progress.
- The resend button disables during the cooldown period.

## 3. MFA Verification UX

### Objective
Verify that OTP verification shows loading feedback and prevents duplicate submissions.

### Steps
1. Open the MFA modal after signing in.
2. Enter a valid 6-character OTP.
3. Click `Verify & Continue`.

### Expected results
- The `Verify & Continue` button displays a loading spinner.
- OTP input fields are disabled while the verification request is pending.
- Successful verification navigates to either the student page or dashboard depending on role.
- Invalid codes produce an error message without navigation.

## 4. Password Reset OTP UX

### Objective
Verify that password reset code verification also shows loading feedback and prevents duplicate resends.

### Steps
1. Use the forgot-password flow and request a password reset.
2. Enter the received 6-character reset code.
3. Click `Verify Code`.
4. If needed, click `Resend Code` while the cooldown is not active.

### Expected results
- The `Verify Code` button displays a spinner while verifying.
- Reset code input fields are disabled during verification.
- The `Resend Code` button shows a spinner while the request is in progress.
- The resend button is disabled during cooldown.
- A successful code validation moves the flow to the `reset-complete` step.

## 5. Signup Success Modal

### Objective
Ensure that successful signup now shows a confirmation modal instead of a browser alert.

### Steps
1. Complete a new user signup flow.
2. Submit the form.

### Expected results
- The alert is no longer used.
- A modal appears with a friendly activation email message.
- The modal contains a button to return to sign in.

## 6. Additional Backend Verifications

### Objective
Validate backend behavior for the new OTP/sending logic and pending registration flow.

### Checks
- Confirm `pending_registrations` records are created for teacher/faculty signup and are deleted upon successful verification.
- Confirm `user_otps` rows are inserted with `used=false` for new OTPs.
- Confirm duplicate/rapid resend attempts do not create multiple available OTPs.
- Confirm the backend logs show skip messages when duplicate sends are suppressed.

## Notes
- If email delivery is unreliable in a test environment, use server logs or the Supabase `user_otps` table to confirm whether a code entry was generated.
- Use private/incognito mode for verification link testing to avoid stale frontend session state.

---
