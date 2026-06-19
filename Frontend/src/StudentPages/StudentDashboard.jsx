import React from 'react';
import '../../css/StudentPortal.css';

const StudentDashboard = ({ studentInfo }) => {
  return (
    <div className="student-page">
      <h2 className="section-title">Student Dashboard</h2>

      <div className="student-summary-grid">
        <div className="student-summary-card">
          <h3>Student Name</h3>
          <p>{studentInfo.name}</p>
        </div>

        <div className="student-summary-card">
          <h3>Grade & Section</h3>
          <p>{studentInfo.gradeLevel}</p>
        </div>

        <div className="student-summary-card">
          <h3>School Year</h3>
          <p>{studentInfo.schoolYear}</p>
        </div>

        <div className="student-summary-card">
          <h3>Status</h3>
          <p>Active</p>
        </div>
      </div>

      <div className="student-info-panel">
        <h3>Announcements</h3>
        <p>No announcements yet.</p>
      </div>
    </div>
  );
};

export default StudentDashboard;