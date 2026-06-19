import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Auth.css';
import bg from '../assets/background.jpg';
import logo from '../assets/UniversityAuthlogo.png';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [signUpRole, setSignUpRole] = useState('faculty');
  const [signUpError, setSignUpError] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
    setSignUpError('');
  };

  const handleRoleChange = (role) => {
    setUserRole(role);
  };

  const handleSignUpRoleChange = (role) => {
    setSignUpRole(role);
    setSignUpError('');
  };

  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
   //Prevent students from signing in
   // if (userRole === 'student') {
     // setIsSignUp(true);
      //return;
    //}
   if (userRole === 'student') {
  navigate('/student');
  return; // para ma view ko lang ang student layout without authentication logic hahaha clear nyo lang
}
    // TODO: perform real authentication here
    navigate('/dashboard');
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    // TODO: perform sign-up logic then redirect
    navigate('/dashboard');
  };

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
            
            {/* Role Toggle Tabs */}
            <div className="role-tabs">
              <button 
                type="button"
                className={`role-tab ${userRole === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                Student
              </button>
              <button 
                type="button"
                className={`role-tab ${userRole === 'faculty' ? 'active' : ''}`}
                onClick={() => handleRoleChange('faculty')}
              >
                Faculty/Prof
              </button>
            </div>

            <div className="form-group">
              <input type="text" placeholder={userRole === 'student' ? 'Student ID' : 'Faculty ID'} />
            </div>
            <div className="form-group password-group">
              <input type={showSignInPassword ? 'text' : 'password'} placeholder="Password" />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showSignInPassword ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </>
                  )}
                </svg>
              </button>
            </div>
            
            <a href="#" className="forgot-link">Forgot your password?</a>
            
            <button type="submit" className="submit-btn">Sign In</button>
          </form>
        </div>

        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form className="auth-form" onSubmit={handleSignUp}>
            <h1 className="form-title">Create Account</h1>
            
            <div className="form-content-wrapper">
              {signUpError && (
                <div className="signup-error-message">
                  {signUpError}
                </div>
              )}
              
              <div className="form-group">
                <label>First Name</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Middle Initial</label>
                <input type="text" maxLength="1" />
              </div>
              <div className="form-group">
                <label>Teacher Email</label>
                <input type="email" required />
              </div>
              <div className="form-group">
                <label>Faculty ID</label>
                <input type="text" required />
              </div>
              <div className="form-group password-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input type={showSignUpPassword ? 'text' : 'password'} required />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showSignUpPassword ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              
              <button type="submit" className="submit-btn">Sign Up</button>
            </div>
          </form>
        </div>

        {/* Overlay Container */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Left Overlay Panel (shown when in sign-up mode) */}
            <div className="overlay-panel overlay-left">
              <h1 className="overlay-title">Welcome Back!</h1>
              <p className="overlay-description">
                To keep connected with your academic portal please login with your personal info
              </p>
              <button className="ghost-btn" onClick={handleToggle}>
                Sign In
              </button>
            </div>
            
            {/* Right Overlay Panel (shown when in sign-in mode) */}
            <div className="overlay-panel overlay-right">
              <h1 className="overlay-title">Hello, Friend!</h1>
              <p className="overlay-description">
                Enter your personal details and start your journey with the academic portal
              </p>
              <button className="ghost-btn" onClick={handleToggle}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;