import React from 'react';
import '../../css/StudentPortal.css';
import { User, Layers, CalendarDays, BadgeCheck } from 'lucide-react';

const StudentDashboard = ({ studentInfo }) => {
  const cards = [
    { icon: <User size={22} color="#0b4bb3" />,       label: 'Student Name',    value: studentInfo.name },
    { icon: <Layers size={22} color="#7c3aed" />,     label: 'Grade & Section', value: studentInfo.gradeLevel },
    { icon: <CalendarDays size={22} color="#0891b2" />,label: 'School Year',    value: studentInfo.schoolYear },
    { icon: <BadgeCheck size={22} color="#059669" />, label: 'Status',          value: 'Active' },
  ];

  return (
    <div className="student-page">
      <h2 className="section-title">Student Dashboard</h2>

      <div className="student-summary-grid">
        {cards.map((card, i) => (
          <div className="student-summary-card" key={i}>
            <div className="summary-card-icon">{card.icon}</div>
            <h3>{card.label}</h3>
            <p>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="student-info-panel">
        <h3>📢 Announcements</h3>
        <p>No announcements yet.</p>
      </div>
    </div>
  );
};

export default StudentDashboard;