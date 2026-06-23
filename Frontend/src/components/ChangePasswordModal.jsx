import React, { useState } from "react";
import "../css/ChangePasswordModal.css";

const ChangePasswordModal = ({ userId, onPasswordChanged, onClose }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*?&]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    checkPasswordStrength(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 5) {
      setError(
        "Password must contain: 8+ characters, uppercase, lowercase, number, and symbol",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      // Password changed successfully - clear the flag from localStorage
      localStorage.removeItem("mustChangePassword");
      onPasswordChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "#ccc";
    if (passwordStrength <= 2) return "#ff4444";
    if (passwordStrength <= 4) return "#ffaa00";
    return "#44aa44";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content change-password-modal">
        <h2>Set Your Password</h2>
        <p className="modal-subtitle">
          Please create a new password to secure your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              disabled={loading}
              required
            />
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getStrengthColor(),
                    }}
                  ></div>
                </div>
                <small style={{ color: getStrengthColor() }}>
                  {passwordStrength === 0 && "Password too weak"}
                  {passwordStrength === 1 && "Very weak"}
                  {passwordStrength === 2 && "Weak"}
                  {passwordStrength === 3 && "Fair"}
                  {passwordStrength === 4 && "Good"}
                  {passwordStrength === 5 && "Strong"}
                </small>
              </div>
            )}
            <small className="password-requirements">
              ✓ At least 8 characters
              <br />
              ✓ Uppercase letter (A-Z)
              <br />
              ✓ Lowercase letter (a-z)
              <br />
              ✓ Number (0-9)
              <br />✓ Special character (@$!%*?&)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="Confirm password"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="btn-primary btn-change-password"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
