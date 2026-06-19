import React from 'react';
import '../../css/StudentPortal.css';

const StudentSchedule = () => {
  const schedule = [
    { time: '8:00 AM - 9:00 AM', subject: 'Filipino', teacher: 'Mrs. Bautista' },
    { time: '9:00 AM - 10:00 AM', subject: 'Math', teacher: 'Mr. Domingo' },
    { time: '10:00 AM - 11:00 AM', subject: 'Reading', teacher: 'Ms. Velasquez' },
    { time: '1:00 PM - 2:00 PM', subject: 'Language', teacher: 'Mr. Reyes' },
  ];

  return (
    <div className="student-page">
      <h2 className="section-title">Schedule</h2>

      <div className="schedule-list">
        {schedule.map((item, index) => (
          <div className="schedule-card" key={index}>
            <h3>{item.subject}</h3>
            <p><strong>Time:</strong> {item.time}</p>
            <p><strong>Teacher:</strong> {item.teacher}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentSchedule;