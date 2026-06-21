import React from 'react';
import '../../css/StudentPortal.css';
import { CircleCheck, CircleX, Timer } from 'lucide-react';

const StudentAttendance = () => {
  const cards = [
    { icon: <CircleCheck size={26} color="#059669" />, label: 'Present', value: '7 Days',  color: 'green' },
    { icon: <CircleX size={26} color="#dc2626" />,     label: 'Absent',  value: '0 Days',  color: 'red'   },
    { icon: <Timer size={26} color="#d97706" />,        label: 'Late',    value: '1 Day',   color: 'amber' },
  ];

  return (
    <div className="student-page">
      <h2 className="section-title">Attendance</h2>

      <div className="student-summary-grid">
        {cards.map((card, i) => (
          <div className={`student-summary-card attendance-card-${card.color}`} key={i}>
            <div className="summary-card-icon">{card.icon}</div>
            <h3>{card.label}</h3>
            <p>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="student-info-panel">
        <h3>📅 Monthly Attendance Record</h3>
        <p>Attendance records will appear here.</p>
      </div>
    </div>
  );
};

export default StudentAttendance;