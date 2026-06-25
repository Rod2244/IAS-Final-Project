import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/profilesettings.css";
import { authService } from "../services/apiClient";

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const fallbackUser = JSON.parse(
            localStorage.getItem("user") || "null",
          );
          const mergedUser = {
            ...(fallbackUser || {}),
            ...(currentUser || {}),
          };

          setProfile({
            firstName: mergedUser.firstName || mergedUser.first_name || "",
            lastName: mergedUser.lastName || mergedUser.last_name || "",
            middleName: mergedUser.middleName || mergedUser.middle_name || "",
            email: mergedUser.email || "",
            phoneNumber:
              mergedUser.phoneNumber || mergedUser.phone_number || "",
            employeeId: mergedUser.employeeId || mergedUser.employee_id || "",
            gradeLevelAssignment:
              mergedUser.gradeLevelAssignment ||
              mergedUser.grade_level_assignment ||
              "",
            classAssignment:
              mergedUser.classAssignment || mergedUser.class_assignment || "",
            department: mergedUser.department || "",
          });
        }
      } catch (error) {
        toast.error("Unable to load profile details.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
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

        {/* Academic Information */}
        <div className="settings-section">
          <h2>Academic Information</h2>
          <form className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label>Grade Level Assignment *</label>
                <select
                  value={profile.gradeLevelAssignment}
                  onChange={(e) =>
                    handleProfileChange("gradeLevelAssignment", e.target.value)
                  }
                >
                  <option value="">Select grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>
              <div className="form-group">
                <label>Class Assignment *</label>
                <select
                  value={profile.classAssignment}
                  onChange={(e) =>
                    handleProfileChange("classAssignment", e.target.value)
                  }
                >
                  <option value="">Select class</option>
                  <option value="Class A">Class A</option>
                  <option value="Class B">Class B</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) =>
                  handleProfileChange("department", e.target.value)
                }
                disabled
              />
            </div>
            <div className="form-group">
              <label>Subjects Taught</label>
              <div className="subjects-taught">
                <span className="subject-tag">Mathematics</span>
                <span className="subject-tag">English</span>
                <span className="subject-tag">Science</span>
                <span className="subject-tag">Social Studies</span>
              </div>
            </div>
            <div className="form-group schedule-group">
              <label>Weekly Schedule</label>
              <div className="schedule-table-wrapper">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Section</th>
                      <th>Time</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            value={row.code}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "code",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. MATH101"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.subject}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "subject",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Mathematics"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.section}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "section",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Class A"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.time}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "time",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Mon 8:00AM - 10:00AM"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-secondary schedule-remove-btn"
                            onClick={() => removeScheduleRow(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn-secondary schedule-add-btn"
                onClick={addScheduleRow}
              >
                + Add Row
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <h2>Security Settings</h2>
          <form className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" placeholder="Enter current password" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
            </div>
            <button type="button" className="btn-secondary">
              Update Password
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <h2>Notification Preferences</h2>
          <div className="notification-settings">
            <div className="notification-item">
              <div className="notification-info">
                <h3>Email Notifications</h3>
                <p>Receive email updates about student activities and grades</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <h3>Grade Submission Reminders</h3>
                <p>Get reminded about upcoming grade submission deadlines</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <h3>Student Attendance Alerts</h3>
                <p>Receive alerts when students are marked absent</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <h3>System Updates</h3>
                <p>Get notified about system maintenance and updates</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button className="btn-primary">Save Changes</button>
          <button className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
