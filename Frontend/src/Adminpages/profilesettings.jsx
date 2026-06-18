import React, { useState } from 'react';
import '../../css/profilesettings.css';

const ProfileSettings = () => {
  const [schedule, setSchedule] = useState([
    { code: 'MATH101', subject: 'Mathematics', section: 'Class A', time: 'Mon 8:00AM - 10:00AM' },
    { code: 'ENG102', subject: 'English', section: 'Class B', time: 'Tue 10:30AM - 12:30PM' },
    { code: 'SCI103', subject: 'Science', section: 'Class A', time: 'Wed 8:00AM - 10:00AM' },
  ]);

  const handleScheduleChange = (index, field, value) => {
    setSchedule((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addScheduleRow = () => {
    setSchedule((prev) => [
      ...prev,
      { code: '', subject: '', section: '', time: '' },
    ]);
  };

  const removeScheduleRow = (index) => {
    setSchedule((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
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
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" defaultValue="Maria" />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" defaultValue="Santos" />
              </div>
            </div>
            <div className="form-group">
              <label>Middle Name</label>
              <input type="text" defaultValue="Reyes" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" defaultValue="maria.santos@summitridge.edu" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" defaultValue="+63 912 345 6789" />
              </div>
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input type="text" defaultValue="EMP-2023-001" disabled />
            </div>
          </form>
        </div>

        {/* Academic Information */}
        <div className="settings-section">
          <h2>Academic Information</h2>
          <form className="settings-form">
            <div className="form-row">
              <div className="form-group">
                <label>Grade Level Assignment *</label>
                <select defaultValue="Grade 3">
                  <option>Grade 1</option>
                  <option>Grade 2</option>
                  <option selected>Grade 3</option>
                  <option>Grade 4</option>
                  <option>Grade 5</option>
                  <option>Grade 6</option>
                </select>
              </div>
              <div className="form-group">
                <label>Class Assignment *</label>
                <select defaultValue="Class A">
                  <option selected>Class A</option>
                  <option>Class B</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" defaultValue="Elementary Department" disabled />
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
                            onChange={(e) => handleScheduleChange(index, 'code', e.target.value)}
                            placeholder="e.g. MATH101"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.subject}
                            onChange={(e) => handleScheduleChange(index, 'subject', e.target.value)}
                            placeholder="e.g. Mathematics"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.section}
                            onChange={(e) => handleScheduleChange(index, 'section', e.target.value)}
                            placeholder="e.g. Class A"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.time}
                            onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
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
              <button type="button" className="btn-secondary schedule-add-btn" onClick={addScheduleRow}>
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
            <button type="button" className="btn-secondary">Update Password</button>
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
