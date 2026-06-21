# ISO 27001 Security Integration

## Purpose
This document describes the immediate ISO 27001-aligned security controls implemented in the project. These changes harden authentication, session handling, and request processing to protect against common threats such as brute force attacks, credential stuffing, and information disclosure.

## Implemented Controls

### 1. Rate limiting and brute-force protection
- Added endpoint-level rate limiting on authentication routes.
- Login attempts are throttled to reduce the impact of automated attack traffic.
- Sign-in requests are limited to a small number of attempts per IP address and user account.

### 2. Account lockout policy
- Implemented a temporary account lockout after repeated failed sign-in attempts.
- Failed logins are counted per normalized email identifier.
- Accounts are locked for a configured interval after exceeding the threshold.
- This prevents repeated credential guessing and enforces lockout controls required by ISO 27001 Annex A.9.

### 3. Generic authentication error handling
- Sign-in failures now return a generic message instead of exposing whether an email or password was invalid.
- This mitigates user enumeration and supports secure authentication practices under ISO 27001 Annex A.9.

### 4. Audit logging for authentication events
- Added audit event recording for user creation, successful sign-in, and failed sign-in attempts.
- Events are written to the `audit_log` table when available.
- Audit trails support ISO 27001 Annex A.12 by capturing security-relevant actions.

### 5. Secure headers and HTTPS enforcement
- Added `helmet` middleware to set security headers such as HSTS, X-Content-Type-Options, and X-Frame-Options.
- Production mode enforces HTTPS to protect credentials and tokens during transit.

### 6. Secure cookie support for session tokens
- The backend now issues a `sessionToken` cookie with `HttpOnly`, `SameSite=Lax`, and `Secure` flags in production.
- This helps protect session tokens from JavaScript access and cross-site request forgery.

### 7. Least privilege and backend-only secrets
- The Supabase service key remains server-side only in `Backend/config/supabase.js`.
- The backend performs privileged operations such as user creation, session tracking, and audit logging.

### 8. Persistent account lockout storage
- Added a persistent `auth_lockouts` table to store failed login counters and lockout expiration.
- Login lockout state now survives server restarts and ensures consistent enforcement across deployments.
- This directly supports reliable access control and incident response requirements.

### 9. CSRF protection
- Added `csurf` middleware in `Backend/server.js` and a `/api/auth/csrf-token` endpoint.
- The frontend reads the `XSRF-TOKEN` cookie and sends it with state-changing requests.
- This protects authenticated cookie-based endpoints from cross-site request forgery.

## Files Updated
- `Backend/server.js`
- `Backend/routes/authRoutes.js`
- `Backend/services/authService.js`
- `Backend/services/securityService.js`
- `Backend/services/auditService.js`
- `Backend/package.json`
- `Backend/auth_lockouts_schema.sql`
- `Frontend/src/services/apiClient.js`

## Recommended Follow-up Controls
ISO 27001 requires additional controls beyond these immediate improvements:

- Multi-factor authentication (MFA) for admin/faculty accounts.
- Content Security Policy (CSP) and XSS mitigation in the frontend.
- Periodic review of audit logs and login reports.
- Formal access control review for Supabase RLS policies.
- Session idle timeout / stronger session management.
- Stronger server-side password policy enforcement.

## ISO Security Checklist

| Control Area | Status | Notes |
| --- | --- | --- |
| Rate limiting on authentication | ✅ Implemented | `express-rate-limit` configured for `/api/auth` |
| Account lockout | ✅ Implemented | Persistent lockout storage via `auth_lockouts` |
| Generic auth error handling | ✅ Implemented | No user enumeration exposure |
| Audit logging | ✅ Implemented | User create/sign-in/fail events logged |
| Secure headers | ✅ Implemented | `helmet()` enabled |
| HTTPS enforcement | ✅ Implemented | Production-only HTTPS enforcement |
| Secure session cookies | ✅ Implemented | `HttpOnly`, `SameSite=Lax`, `Secure` in production |
| CSRF protection | ✅ Implemented | `csurf` and `XSRF-TOKEN` support added |
| MFA for admin/faculty | ❌ Not implemented | Recommended for privileged accounts |
| CSP / frontend XSS protection | ✅ Implemented | CSP header added and frontend payloads sanitized |
| Role-based authorization review | ❌ Not implemented | Supabase RLS and access audit needed |
| Session idle timeout | ✅ Implemented | 30 minute inactivity timeout enforced and updated on requests |
| Audit review / retention policy | ❌ Not implemented | Review process not documented |
| Server-side password policy | ❌ Not implemented | Stronger server-side enforcement needed |

## Notes
These changes focus on rapid hardening of the authentication flow and should be tested in a staging environment before production deployment. The next phase should include MFA, CSP, authorization review, session idle timeout, and a complete audit review process.
