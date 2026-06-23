import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Auth.css';
import bg from '../assets/background.jpg';
import logo from '../assets/UniversityAuthlogo.png';
import { authService } from '../services/apiClient';

const EyeIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const AuthPage = () => {
  const navigate = useNavigate();

  // Sign-in state
  const [isSignUp, setIsSignUp] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // Sign Up Form State
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpMiddleInitial, setSignUpMiddleInitial] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpFacultyId, setSignUpFacultyId] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');

  // Modal flow state
  const [step, setStep] = useState('login');

  // Signup success message for modal
  const [signupMessage, setSignupMessage] = useState('');

  // Set-password modal state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // MFA state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [mfaSubmitting, setMfaSubmitting] = useState(false);
  const [mfaResendLoading, setMfaResendLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetNewPass, setShowResetNewPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);
  const [resetResendCooldown, setResetResendCooldown] = useState(0);
  const [mfaResendCooldown, setMfaResendCooldown] = useState(0);
  const [resetVerifying, setResetVerifying] = useState(false);
  const [resetResendLoading, setResetResendLoading] = useState(false);

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
    setSignUpError('');
    setSignInError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');
    setIsLoading(true);

    try {
      // Use email as the identifier for both students and faculty
      const result = await authService.signIn(signInEmail, signInPassword);

      if (result.success) {
        const actualRole = result.userRole;

        // Prevent admin/teacher accounts from signing in through student tab
        if (userRole === 'student' && actualRole !== 'student') {
          throw new Error('This account must sign in through the Faculty/Prof tab.');
        }

        // Prevent student accounts from signing in through faculty tab
        if (userRole === 'faculty' && actualRole === 'student') {
          throw new Error('Use the Student tab to sign in with this account.');
        }

        // If MFA is required, show MFA modal and stop navigation
        if (result.mfaRequired) {
          setUserEmail(result.email);
          // normalize role for UI
          setUserRole(result.userRole === 'admin' ? 'faculty' : result.userRole);
          setMfaResendCooldown(60);
          setStep('mfa');
          return;
        }

        // Store user role
        localStorage.setItem('userRole', actualRole);

        if (actualRole === 'student') {
          navigate('/student');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setSignInError(error.response?.data?.error || error.message || 'Sign in failed. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError('');
    setIsLoading(true);

    try {
      // Validation
      if (!signUpFirstName || !signUpLastName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
        throw new Error('Please fill in all required fields');
      }

      if (signUpPassword !== signUpConfirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (signUpPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (!isPasswordStrong(signUpPassword)) {
        throw new Error('Password is not strong enough. Use uppercase, lowercase, number, and symbol.');
      }

      const signUpRole = userRole === 'faculty' ? 'teacher' : userRole;

      // Call signup API with all profile data
      const result = await authService.signUp(
        signUpEmail,
        signUpPassword,
        signUpRole,
        {
          firstName: signUpFirstName,
          lastName: signUpLastName,
          middleInitial: signUpMiddleInitial,
          facultyId: signUpFacultyId,
        }
      );
      
      if (result.success) {
        // Store email for later reference
        setUserEmail(signUpEmail);
        // Clear errors
        setSignUpError('');
        // Reset form
        setSignUpFirstName('');
        setSignUpLastName('');
        setSignUpMiddleInitial('');
        setSignUpEmail('');
        setSignUpFacultyId('');
        setSignUpPassword('');
        // Toggle back to sign in view but show a modal instead of alert
        setIsSignUp(false);
        const msg = result.message || 'An activation email has been sent to your address. Please verify your email to activate your account before signing in.';
        setSignupMessage(msg);
        setStep('signup-success');
      }
    } catch (error) {
      setSignUpError(error.response?.data?.error || error.message || 'Sign up failed. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordStrong = (password) => {
    return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
  };

  const getPasswordStrengthLabel = (password) => {
    if (!password) return '';
    if (isPasswordStrong(password)) return 'Strong password';
    if (password.length >= 8) return 'Moderate password — add uppercase, number, and symbol';
    return 'Weak password — at least 8 chars, uppercase, number, and symbol';
  };

  useEffect(() => {
    if (resetResendCooldown <= 0 && mfaResendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResetResendCooldown((prev) => Math.max(prev - 1, 0));
      setMfaResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resetResendCooldown, mfaResendCooldown]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      if (!resetEmail) {
        throw new Error('Please enter your email address.');
      }

      await authService.requestPasswordReset(resetEmail);
      setResetCode(['', '', '', '', '', '']);
      setStep('reset-verify');
      setResetSuccess('A reset code has been sent to your email address.');
      setResetResendCooldown(60);
    } catch (err) {
      setResetError(err.response?.data?.error || err.message || 'Unable to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCodeChange = (index, value) => {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (sanitized.length > 1) return;
    const next = [...resetCode];
    next[index] = sanitized;
    setResetCode(next);
    if (sanitized && index < 5) {
      document.getElementById(`reset-code-${index + 1}`)?.focus();
    }
  };

  const handleResetCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      document.getElementById(`reset-code-${index - 1}`)?.focus();
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const code = resetCode.join('');

    if (code.length < 6) {
      setResetError('Please enter the complete 6-character code.');
      return;
    }

    try {
      setResetVerifying(true);
      const response = await authService.verifyPasswordResetOtp(resetEmail, code);
      if (response.success) {
        setStep('reset-complete');
        setResetSuccess('Code verified. Enter your new password below.');
      } else {
        setResetError(response.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setResetError(err.response?.data?.error || err.message || 'Unable to verify reset code.');
    } finally {
      setResetVerifying(false);
    }
  };

  const handleResendResetCode = async () => {
    if (resetResendCooldown > 0) return;

    setResetError('');
    setResetSuccess('');
    setResetCode(['', '', '', '', '', '']);

    try {
      setResetResendLoading(true);
      await authService.requestPasswordReset(resetEmail);
      setResetSuccess('A new reset code has been sent to your email.');
      setResetResendCooldown(60);
    } catch (err) {
      setResetError(err.response?.data?.error || err.message || 'Unable to resend reset code. Please try again.');
    }
    finally {
      setResetResendLoading(false);
    }
  };

  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newResetPassword || !confirmResetPassword) {
      setResetError('Please enter and confirm your new password.');
      return;
    }
    if (newResetPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    if (!isPasswordStrong(newResetPassword)) {
      setResetError('Password is not strong enough.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    const code = resetCode.join('');
    if (code.length < 6) {
      setResetError('Please enter the complete 6-character code.');
      return;
    }

    try {
      const response = await authService.completePasswordReset(resetEmail, code, newResetPassword);
      if (response.success) {
        setStep('reset-success');
        setResetSuccess(response.message || 'Your password has been changed successfully.');
      } else {
        setResetError(response.error || 'Unable to reset password. Please try again.');
      }
    } catch (err) {
      setResetError(err.response?.data?.error || err.message || 'Unable to reset password.');
    }
  };

  const handleSetPassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setPasswordError('Password is not strong enough.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setStep('mfa');
  };

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (sanitized.length > 1) return;
    const next = [...otp];
    next[index] = sanitized;
    setOtp(next);
    if (sanitized && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpMessage('');
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError('Please enter the complete 6-character code.');
      return;
    }

    // Verify OTP with backend
      (async () => {
        setMfaSubmitting(true);
        try {
          const response = await authService.verifyOtp(
            userEmail || signInEmail,
            code,
            window.location.hostname,
            navigator.userAgent,
          );

          if (response.success) {
            const role = response.userRole || localStorage.getItem('userRole') || 'student';
            localStorage.setItem('userRole', role);
            if (role === 'student') navigate('/student');
            else navigate('/dashboard');
          } else {
            setOtpError(response.error || 'Invalid code. Please try again.');
          }
        } catch (err) {
          setOtpError(err.response?.data?.error || err.message || 'Verification failed. Please try again.');
        } finally {
          setMfaSubmitting(false);
        }
      })();
  };

  const handleResendOtp = async () => {
    if (mfaResendCooldown > 0) return;

    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpMessage('');
    try {
      setMfaResendLoading(true);
      await authService.sendOtp(userEmail || signInEmail);
      setOtpMessage('A new verification code has been sent to your email.');
      setMfaResendCooldown(60);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError('Unable to resend code right now. Please try again shortly.');
    }
    finally {
      setMfaResendLoading(false);
    }
  };

  const handleCloseModal = () => {
    setStep('login');
    setPasswordError('');
    setOtpError('');
    setResetError('');
    setResetSuccess('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp(['', '', '', '', '', '']);
    setResetEmail('');
    setResetCode(['', '', '', '', '', '']);
    setNewResetPassword('');
    setConfirmResetPassword('');
    setShowResetNewPass(false);
    setShowResetConfirmPass(false);
    setResetResendCooldown(0);
    setMfaResendCooldown(0);
  };

  const isStudentTab = userRole === 'student';

  return (
    <div
      className="auth-container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header className="auth-header">
        <div className="auth-branding">
          <img src={logo} alt="Summit Ridge Logo" className="auth-logo" />
          <div className="auth-title-block">
            <h1 className="auth-site-title">Summit Ridge University</h1>
            <p className="auth-subtitle">A Legacy of Excellence</p>
          </div>
        </div>
      </header>

      <div className={`auth-card ${isSignUp ? 'sign-up-mode' : ''}`}>
        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form className="auth-form" onSubmit={handleSignIn}>
            <h1 className="form-title">Sign In</h1>

            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab ${userRole === 'student' ? 'active' : ''}`}
                onClick={() => setUserRole('student')}
              >
                Student
              </button>
              <button
                type="button"
                className={`role-tab ${userRole === 'faculty' ? 'active' : ''}`}
                onClick={() => setUserRole('faculty')}
              >
                Faculty/Prof
              </button>
            </div>

            {signInError && (
              <div style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {signInError}
              </div>
            )}

            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group password-group">
              <input
                type={showSignInPassword ? 'text' : 'password'}
                placeholder="Password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                disabled={isLoading}
              >
                <EyeIcon open={showSignInPassword} />
              </button>
            </div>

            <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); setStep('reset-request'); }}>Forgot your password?</a>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form className="auth-form" onSubmit={handleSignUp}>
            <h1 className="form-title">Create Account</h1>
            <div className="form-content-wrapper">
              {signUpError && (
                <div className="signup-error-message">{signUpError}</div>
              )}
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={signUpFirstName}
                  onChange={(e) => setSignUpFirstName(e.target.value)}
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={signUpLastName}
                  onChange={(e) => setSignUpLastName(e.target.value)}
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Middle Initial</label>
                <input 
                  type="text" 
                  maxLength={1}
                  value={signUpMiddleInitial}
                  onChange={(e) => setSignUpMiddleInitial(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Teacher Email</label>
                <input 
                  type="email" 
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Faculty ID</label>
                <input 
                  type="text" 
                  value={signUpFacultyId}
                  onChange={(e) => setSignUpFacultyId(e.target.value)}
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="form-group password-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showSignUpPassword ? 'text' : 'password'} 
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required 
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    disabled={isLoading}
                  >
                    <EyeIcon open={showSignUpPassword} />
                  </button>
                </div>
                {signUpPassword && (
                  <p className={`password-strength-label ${isPasswordStrong(signUpPassword) ? 'strong' : 'weak'}`}>
                    {getPasswordStrengthLabel(signUpPassword)}
                  </p>
                )}
              </div>
              <div className="form-group password-group">
                <label>Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    disabled={isLoading}
                  >
                    <EyeIcon open={showSignUpPassword} />
                  </button>
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="overlay-title">Welcome Back!</h1>
              <p className="overlay-description">
                To keep connected with your academic portal please login with your personal info
              </p>
              <button className="ghost-btn" onClick={handleToggle}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="overlay-title">Hello, Friend!</h1>
              <p className="overlay-description">
                Enter your personal details and start your journey with the academic portal
              </p>
              {userRole === 'faculty' && (
                <button className="ghost-btn" onClick={handleToggle}>Sign Up</button>
              )}
              {userRole === 'student' && (
                <p className="overlay-note">
                  Student accounts are created by the registrar's office. Contact your administrator for access.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Password Reset Request */}
      {step === 'reset-request' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-key">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h2 className="modal-title">Reset Your Password</h2>
            <p className="modal-subtitle">
              Enter your email and we'll send a 6-character reset code.
            </p>

            <form className="modal-form" onSubmit={handleRequestReset}>
              {resetError && <div className="modal-error">{resetError}</div>}
              {resetSuccess && <div className="modal-success">{resetSuccess}</div>}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your account email"
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Password Reset Verification */}
      {step === 'reset-verify' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-shield">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h2 className="modal-title">Enter Reset Code</h2>
            <p className="modal-subtitle">
              A 6-character reset code was sent to {resetEmail}.
            </p>

            <form className="modal-form" onSubmit={handleVerifyResetCode}>
              {resetError && <div className="modal-error">{resetError}</div>}
              {resetSuccess && <div className="modal-success">{resetSuccess}</div>}

              <div className="otp-group">
                {resetCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`reset-code-${i}`}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleResetCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleResetCodeKeyDown(i, e)}
                    className="otp-input"
                    autoFocus={i === 0}
                    disabled={resetVerifying}
                    aria-label={`Reset code character ${i + 1}`}
                  />
                ))}
              </div>

              <button type="submit" className="submit-btn modal-submit-btn" disabled={resetVerifying}>
                {resetVerifying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}>
                    <g>
                      <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="#fff" strokeWidth="2" fill="none">
                        <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </g>
                  </svg>
                ) : 'Verify Code'}
              </button>
            </form>
            <div className="otp-resend reset-resend">
              Didn’t receive the reset code?{' '}
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendResetCode}
                disabled={resetResendCooldown > 0 || resetResendLoading}
              >
                {resetResendLoading ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}>
                    <g>
                      <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2" fill="none" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="#000" strokeWidth="2" fill="none">
                        <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </g>
                  </svg>
                ) : (resetResendCooldown > 0 ? `Resend in ${resetResendCooldown}s` : 'Resend Code')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Password Reset Complete */}
      {step === 'reset-complete' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-key">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h2 className="modal-title">Create New Password</h2>
            <p className="modal-subtitle">
              Enter a strong new password and confirm it below.
            </p>

            <form className="modal-form" onSubmit={handleCompletePasswordReset}>
              {resetError && <div className="modal-error">{resetError}</div>}
              {resetSuccess && <div className="modal-success">{resetSuccess}</div>}

              <div className="form-group password-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showResetNewPass ? 'text' : 'password'}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowResetNewPass(!showResetNewPass)}>
                    <EyeIcon open={showResetNewPass} />
                  </button>
                </div>
                {newResetPassword && (
                  <p className={`password-strength-label ${isPasswordStrong(newResetPassword) ? 'strong' : 'weak'}`}>
                    {getPasswordStrengthLabel(newResetPassword)}
                  </p>
                )}
              </div>

              <div className="form-group password-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showResetConfirmPass ? 'text' : 'password'}
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}>
                    <EyeIcon open={showResetConfirmPass} />
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn modal-submit-btn">Save New Password</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Password Reset Success */}
      {step === 'reset-success' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-shield">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="modal-title">Password Updated</h2>
            <p className="modal-subtitle">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            {resetSuccess && <div className="modal-success">{resetSuccess}</div>}
            <button type="button" className="submit-btn modal-submit-btn" onClick={handleCloseModal}>
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* Modal: Set New Password */}
      {step === 'set-password' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-key">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h2 className="modal-title">Set New Password</h2>
            <p className="modal-subtitle">
              Your first login requires a new password. Choose something strong and memorable.
            </p>

            <form className="modal-form" onSubmit={handleSetPassword}>
              {passwordError && (
                <div className="modal-error">{passwordError}</div>
              )}
              <div className="form-group password-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowNewPass(!showNewPass)}>
                    <EyeIcon open={showNewPass} />
                  </button>
                </div>
              </div>
              <div className="form-group password-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                    <EyeIcon open={showConfirmPass} />
                  </button>
                </div>
              </div>
              <div className="password-strength-hints">
                <span className={newPassword.length >= 8 ? 'hint-met' : 'hint-unmet'}>✓ At least 8 characters</span>
                <span className={/[A-Z]/.test(newPassword) ? 'hint-met' : 'hint-unmet'}>✓ One uppercase letter</span>
                <span className={/\d/.test(newPassword) ? 'hint-met' : 'hint-unmet'}>✓ One number</span>
              </div>
              <button type="submit" className="submit-btn modal-submit-btn">Continue</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: MFA / OTP */}
      {step === 'mfa' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-shield">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h2 className="modal-title">Verify Your Identity</h2>
            <p className="modal-subtitle">
              A 6-character verification code has been sent to your registered email.
            </p>

            <form className="modal-form" onSubmit={handleVerifyOtp}>
              {otpError && <div className="modal-error">{otpError}</div>}
              {otpMessage && <div className="modal-success">{otpMessage}</div>}

              <div className="otp-group">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="otp-input"
                    autoFocus={i === 0}
                    disabled={mfaSubmitting}
                    aria-label={`OTP character ${i + 1}`}
                  />
                ))}
              </div>

              <button type="submit" className="submit-btn modal-submit-btn" disabled={mfaSubmitting}>
                {mfaSubmitting ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}>
                    <g>
                      <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="#fff" strokeWidth="2" fill="none">
                        <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </g>
                  </svg>
                ) : 'Verify & Continue'}
              </button>

              <div className="otp-resend">
                Didn't receive a code?{' '}
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendOtp}
                  disabled={mfaResendCooldown > 0 || mfaResendLoading}
                >
                  {mfaResendLoading ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}>
                      <g>
                        <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2" fill="none" opacity="0.25" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="#000" strokeWidth="2" fill="none">
                          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                        </path>
                      </g>
                    </svg>
                  ) : (mfaResendCooldown > 0 ? `Resend in ${mfaResendCooldown}s` : 'Resend Code')}
                </button>
              </div>
            </form>

            <p className="modal-back-note">
              After verification you'll be redirected back to{' '}
              <button type="button" className="resend-btn" onClick={handleCloseModal}>
                Sign In
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Modal: Signup Success / Activation Sent */}
      {step === 'signup-success' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-mail">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <h2 className="modal-title">Check Your Email</h2>
            <p className="modal-subtitle">
              {signupMessage || 'We have sent an activation link to your email. Follow the link to activate your account before signing in.'}
            </p>
            <div className="modal-actions">
              <button type="button" className="submit-btn modal-submit-btn" onClick={handleCloseModal}>
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;