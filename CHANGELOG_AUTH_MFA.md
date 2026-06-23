# Auth & MFA Changes — Summary

Date: 2026-06-23

This document summarizes the authentication and MFA-related changes implemented recently.

## Overview
- Fixed duplicate OTP emails and added server-side dedup safeguards.
- Implemented a pending-registration + email verification flow for teacher/faculty signups and changed verification link to hit backend verification endpoint.
- Replaced frontend signup alert with a proper modal informing the user that an activation email was sent.
- Added loading states and inline spinner icons for MFA and password-reset OTP modals.

## Backend changes
- `Backend/routes/authRoutes.js`
  - Sign-up flow: teacher/faculty/admin accounts now create or update a `pending_registrations` record with encrypted password and a `verification_token` instead of immediately creating a user.
  - Email activation URL now points to the backend verify endpoint (`/api/auth/verify-email?token=...`) so the server handles token validation and user creation.
  - `GET /api/auth/verify-email` handler: decrypts pending password, calls `authService.signUp`, deletes the pending row, and redirects to the frontend login with a `verified=true` query.

- `Backend/services/mfaService.js`
  - Added a short recent-send guard (30s) to skip obviously repeated sends.
  - Changed OTP insertion/send flow to "insert first, then check latest unused OTP" — only the most recent unused OTP will actually trigger an email. Concurrent inserts are marked used and skipped to avoid double emails.
  - Kept auditing and best-effort email sends; added console logging lines when skipping duplicate sends.

- `Backend/services/authService.js`
  - Sign-up continues to use Supabase Admin API for user creation and inserts into `users` (and `teachers`/`students`) tables. Errors are handled centrally.

## Frontend changes
- `Frontend/src/Adminpages/Auth.jsx`
  - Replaced the `alert('Account created successfully...')` on signup success with a proper `signup-success` modal that displays an activation message.
  - Added `signupMessage` state to show backend-provided or default activation text.
  - Added loading state flags and UX polish for MFA and password-reset flows:
    - `mfaSubmitting`, `mfaResendLoading`, `resetVerifying`, `resetResendLoading` state variables.
    - Buttons show inline SVG spinners while requests run and inputs are disabled to prevent double submissions.

- `Frontend/src/services/apiClient.js`
  - Unchanged behavior, frontend continues to call `/api/auth/mfa/send` and `/api/auth/mfa/verify`, but now receives more robust server behavior preventing duplicate emails.

## Database / Migrations
- `Backend/migrations/002_create_pending_registrations.sql` (created earlier)
  - New table `pending_registrations` holds temporary records for unverified teacher/faculty signups. Fields include encrypted password pieces, `verification_token`, and `token_expires_at`.

## How it prevents the original issues
- Double OTP emails: server ensures only the latest unused OTP triggers an email; race conditions resulting in two near-simultaneous inserts will result in only one email being sent.
- Premature dashboard redirect after verification: the verification link now points to backend which attempts to create the user and redirects to a login page with a query param; if user creation fails the server responds with an error (improved logging available).
- Signup UX: users receive a clear modal directing them to check their email for activation rather than an ambiguous alert.

## Next recommended actions
- Restart the backend and frontend servers and test flows:
  - Teacher signup → check email → follow link in private/incognito window to validate backend flow.
  - Sign in with OTP → try rapid "resend" attempts to verify duplicate-skip behavior.
- (Optional) Add an explicit API flag to OTP responses to indicate whether an email was actually sent or skipped, so the frontend message can reflect that.
- (Optional) Add a DB partial/unique index to further strengthen duplicate prevention (requires running a migration in Supabase).

## Files touched
- Backend/routes/authRoutes.js
- Backend/services/mfaService.js
- Backend/services/authService.js (inspected/referenced)
- Backend/migrations/002_create_pending_registrations.sql
- Frontend/src/Adminpages/Auth.jsx
- Frontend/src/services/apiClient.js (inspected)


---