import React, { useState } from 'react';
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
  const [signUpError, setSignUpError] = useState('');

  // Modal flow state
  const [step, setStep] = useState('login');

  // Set-password modal state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // MFA state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [userEmail, setUserEmail] = useState('');

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
      if (!signUpFirstName || !signUpLastName || !signUpEmail || !signUpPassword) {
        throw new Error('Please fill in all required fields');
      }

      if (signUpPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
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
        // Show success message
        setSignUpError(''); // Clear errors
        // Reset form
        setSignUpFirstName('');
        setSignUpLastName('');
        setSignUpMiddleInitial('');
        setSignUpEmail('');
        setSignUpFacultyId('');
        setSignUpPassword('');
        // Toggle back to sign in
        setIsSignUp(false);
        // Show success message
        alert('Account created successfully! Please sign in with your credentials.');
      }
    } catch (error) {
      setSignUpError(error.response?.data?.error || error.message || 'Sign up failed. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setStep('mfa');
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
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
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError('Please enter the complete 6-digit code.');
      return;
    }
    // TODO: validate OTP with backend
    // On success → go to student dashboard
    navigate('/student');
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    // TODO: trigger resend API call
  };

  const handleCloseModal = () => {
    setStep('login');
    setPasswordError('');
    setOtpError('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp(['', '', '', '', '', '']);
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

            <a href="#" className="forgot-link">Forgot your password?</a>
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
              A 6-digit verification code has been sent to your registered email or mobile number.
            </p>

            <form className="modal-form" onSubmit={handleVerifyOtp}>
              {otpError && <div className="modal-error">{otpError}</div>}

              <div className="otp-group">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="otp-input"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button type="submit" className="submit-btn modal-submit-btn">Verify & Continue</button>

              <div className="otp-resend">
                Didn't receive a code?{' '}
                <button type="button" className="resend-btn" onClick={handleResendOtp}>
                  Resend Code
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
    </div>
  );
};

export default AuthPage;