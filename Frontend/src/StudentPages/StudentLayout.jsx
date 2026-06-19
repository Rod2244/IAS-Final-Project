import React, { useState, useRef, useEffect } from 'react';
import '../../css/StudentPortal.css';
import StudentDashboard from './StudentDashboard';
import StudentGrades from './StudentGrades';
import StudentAttendance from './StudentAttendance';
import StudentSchedule from './StudentSchedule';
import logo from '../assets/UniversityAuthlogo.png';

const StudentLayout = () => {
  const [activeTab, setActiveTab] = useState('grades');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Clear any stored session/auth data, then send the student back to login.
    localStorage.removeItem('studentToken');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const studentInfo = {
    name: 'Dennis Whitaker',
    gradeLevel: 'Grade 1 - Amethyst',
    lrn: '12623110121',
    schoolYear: '2026-2027',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentDashboard studentInfo={studentInfo} />;
      case 'grades':
        return <StudentGrades />;
      case 'attendance':
        return <StudentAttendance />;
      case 'schedule':
        return <StudentSchedule />;
      default:
        return <StudentGrades />;
    }
  };

  return (
    <div className="student-portal">
      <header className="student-header">
        <div className="student-header-left">
          <img src={logo} alt="Summit Ridge Academy Logo" className="student-header-logo" />
          <div>
            <h1 className="student-school-name">Summit Ridge Academy - Student Portal</h1>
            <p className="student-school-subtitle">Elementary Department</p>
          </div>
        </div>

        <div className="student-header-right" ref={profileRef}>
          <div
            className="student-profile-badge"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
          >
            <div className="student-avatar">{studentInfo.name.charAt(0)}</div>
            <div>
              <strong>{studentInfo.name}</strong>
              <p>{studentInfo.gradeLevel}</p>
            </div>
            <span className={`profile-caret ${profileMenuOpen ? 'open' : ''}`}>▾</span>
          </div>

          {profileMenuOpen && (
            <div className="profile-dropdown">
              <button
                className="profile-dropdown-item"
                onClick={() => {
                  setActiveTab('dashboard');
                  setProfileMenuOpen(false);
                }}
              >
                View Profile
              </button>
              <button
                className="profile-dropdown-item logout-item"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="student-main">
        <section className="student-hero-card">
          <div className="student-hero-icon">📘</div>
          <div>
            <h2>{studentInfo.gradeLevel}</h2>
            <p>Welcome back, {studentInfo.name}</p>
            <p>LRN: {studentInfo.lrn}</p>
            <p>School Year: {studentInfo.schoolYear}</p>
          </div>
        </section>

        <nav className="student-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'grades' ? 'active' : ''}
            onClick={() => setActiveTab('grades')}
          >
            My Grades
          </button>
          <button
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button
            className={activeTab === 'schedule' ? 'active' : ''}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
        </nav>

        <section className="student-content">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default StudentLayout;