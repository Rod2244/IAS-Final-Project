import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/profilesettings.css";
import { userService } from "../services/apiClient";

const ProfileSettings = () => {
  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const [profile, setProfile] = useState({
    firstName: storedUser?.first_name || storedUser?.firstName || "",
    lastName: storedUser?.last_name || storedUser?.lastName || "",
    middleName: storedUser?.middle_name || storedUser?.middleName || "",
    email: storedUser?.email || "",
    phoneNumber: storedUser?.phone_number || storedUser?.phoneNumber || "",
    employeeId: storedUser?.employee_id || storedUser?.employeeId || "",
    gradeLevelAssignment: storedUser?.grade_level_assignment || "",
    classAssignment: storedUser?.class_assignment || "",
    department: storedUser?.department || "",
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    gradeReminders: true,
    attendanceAlerts: true,
    systemUpdates: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [schedule, setSchedule] = useState([
    {
      code: "MATH101",
      subject: "Mathematics",
      section: "Class A",
      time: "Mon 8:00AM - 10:00AM",
    },
    {
      code: "ENG102",
      subject: "English",
      section: "Class B",
      time: "Tue 10:30AM - 12:30PM",
    },
    {
      code: "SCI103",
      subject: "Science",
      section: "Class A",
      time: "Wed 8:00AM - 10:00AM",
    },
  ]);

  const handleScheduleChange = (index, field, value) => {
    setSchedule((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addScheduleRow = () => {
    setSchedule((prev) => [
      ...prev,
      { code: "", subject: "", section: "", time: "" },
    ]);
  };

  const removeScheduleRow = (index) => {
    setSchedule((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const fallbackUser = JSON.parse(localStorage.getItem("user") || "null");

      if (fallbackUser) {
        setProfile((prev) => ({
          ...prev,
          firstName:
            fallbackUser.firstName || fallbackUser.first_name || prev.firstName,
          lastName:
            fallbackUser.lastName || fallbackUser.last_name || prev.lastName,
          middleName:
            fallbackUser.middleName ||
            fallbackUser.middle_name ||
            prev.middleName,
          email: fallbackUser.email || prev.email,
          phoneNumber:
            fallbackUser.phoneNumber ||
            fallbackUser.phone_number ||
            prev.phoneNumber,
          employeeId:
            fallbackUser.employeeId ||
            fallbackUser.employee_id ||
            prev.employeeId,
          gradeLevelAssignment:
            fallbackUser.gradeLevelAssignment ||
            fallbackUser.grade_level_assignment ||
            prev.gradeLevelAssignment,
          classAssignment:
            fallbackUser.classAssignment ||
            fallbackUser.class_assignment ||
            prev.classAssignment,
          department: fallbackUser.department || prev.department,
        }));
      }

      const currentUser = await userService.getProfile();
      if (currentUser) {
        const mergedUser = {
          ...(fallbackUser || {}),
          ...(currentUser || {}),
        };

        setProfile({
          firstName: mergedUser.firstName || mergedUser.first_name || "",
          lastName: mergedUser.lastName || mergedUser.last_name || "",
          middleName: mergedUser.middleName || mergedUser.middle_name || "",
          email: mergedUser.email || "",
          phoneNumber: mergedUser.phoneNumber || mergedUser.phone_number || "",
          employeeId: mergedUser.employeeId || mergedUser.employee_id || "",
          gradeLevelAssignment:
            mergedUser.gradeLevelAssignment ||
            mergedUser.grade_level_assignment ||
            "",
          classAssignment:
            mergedUser.classAssignment || mergedUser.class_assignment || "",
          department: mergedUser.department || "",
        });

        // Load notification preferences
        if (mergedUser.notificationPreferences) {
          setNotifications({
            emailNotifications:
              mergedUser.notificationPreferences.email_notifications ?? true,
            gradeReminders:
              mergedUser.notificationPreferences.grade_reminders ?? true,
            attendanceAlerts:
              mergedUser.notificationPreferences.attendance_alerts ?? true,
            systemUpdates:
              mergedUser.notificationPreferences.system_updates ?? false,
          });
        }

        // Load schedule if available
        if (mergedUser.schedule && Array.isArray(mergedUser.schedule)) {
          setSchedule(mergedUser.schedule);
        }
      }
    } catch (error) {
      toast.error("Unable to load profile details.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await userService.updateProfile({ ...profile, schedule });
      toast.success("Profile updated successfully!");
      // Update local storage
      localStorage.setItem("user", JSON.stringify(profile));
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      await userService.updatePassword(currentPassword, newPassword);
      toast.success("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update password.");
    }
  };

  const handleCancel = async () => {
    await loadProfile();
    toast.info("Changes discarded.");
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    try {
      await userService.updateNotifications(notifications);
      toast.success("Notification preferences updated successfully!");
    } catch (error) {
      toast.error("Failed to update notification preferences.");
    }
  };

  return (
    <div className="profile-settings">
      <div className="page-header">
        <h1>Profile Settings</h1>
      </div>

      <div className="settings-container">
        {/* Profile Information */}
        <div className="settings-section">
          <h2>Profile Information</h2>
          <div className="profile-header">
            <div className="profile-avatar-large">
              <span>MS</span>
            </div>
            <div className="profile-actions">
              <button className="btn-secondary">Change Photo</button>
            </div>
          </div>

          <form className="settings-form">
            {isLoadingProfile ? (
              <p>Loading profile...</p>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        handleProfileChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        handleProfileChange("lastName", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    value={profile.middleName}
                    onChange={(e) =>
                      handleProfileChange("middleName", e.target.value)
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phoneNumber}
                      onChange={(e) =>
                        handleProfileChange("phoneNumber", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" value={profile.employeeId} disabled />
                </div>
              </>
            )}
          </form>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <h2>Security Settings</h2>
          <form className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  handlePasswordFormChange("currentPassword", e.target.value)
                }
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    handlePasswordFormChange("newPassword", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    handlePasswordFormChange("confirmPassword", e.target.value)
                  }
                />
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleUpdatePassword}
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSaveProfile}>
            Save Changes
          </button>
          <button className="btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
