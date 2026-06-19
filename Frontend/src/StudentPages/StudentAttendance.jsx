import React from 'react'
import '../../css/StudentPortal.css';

const StudentAttendance = () => {
  return (
    <div className="student-page">
      <h2 className="section-title">Attendance</h2>

      <div className="student-summary-grid">
        <div className="student-summary-card">
          <h3>Present</h3>
          <p>7 Days</p>
        </div>

        <div className="student-summary-card">
          <h3>Absent</h3>
          <p>1 Days</p>
        </div>

        <div className="student-summary-card">
          <h3>Late</h3>
          <p>1 Day</p>
        </div>
      </div>

      <div className="student-info-panel">
        <h3>Monthly Attendance Record</h3>
        <p>Attendance records will appear here.</p>
      </div>
    </div>
  );
};

export default StudentAttendance;