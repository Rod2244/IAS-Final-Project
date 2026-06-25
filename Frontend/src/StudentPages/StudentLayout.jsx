import React, { useState, useRef, useEffect } from 'react';
import '../../css/StudentPortal.css';
import StudentDashboard from './StudentDashboard';
import StudentGrades from './StudentGrades';
import StudentAttendance from './StudentAttendance';
import StudentSchedule from './StudentSchedule';
import logo from '../assets/UniversityAuthlogo.png';
import { authService } from '../services/apiClient';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Clock,
  LogOut,
  User,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';

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
    localStorage.removeItem('studentToken');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const [studentInfo, setStudentInfo] = useState({
    name: 'Loading...',
    gradeLevel: 'Loading...',
    lrn: '...',
    schoolYear: '...',
  });

useEffect(() => {
    const loadStudentProfile = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser?.email) return;

        const res = await fetch('http://localhost:5000/api/students');
        const json = await res.json();
        
        // --- DEBUG LOGGING ---
        console.log("Full Student List from API:", json);
        // This log will tell us exactly what keys (like 'email') exist in your data
        if (json.data && json.data.length > 0) {
           console.log("First student record looks like:", json.data[0]);
        }
        // ---------------------

// --- UPDATED LOGIC: Match by user_id ---
        const profile = (json.data || []).find((s) => {
            // Compare the ID from the database with the ID of the logged-in user
            return s.user_id === currentUser.id; 
        });
        // --------------------------------------

        if (profile) {
          setStudentInfo({
            name: profile.name || 'Unknown Student',
            gradeLevel: `${profile.grade || ''} ${profile.class ? `- ${profile.class}` : ''}`,
            lrn: profile.lrn || 'N/A',
            schoolYear: profile.school_year || '2026-2027',
          });
        } else {
          console.error("NO MATCH FOUND. User ID:", currentUser.id);
        }
      } catch (err) {
        console.error('Failed to load student profile layout:', err);
      }
    };

    loadStudentProfile();
  }, []); 

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'grades',    label: 'My Grades', icon: <BookOpen size={18} /> },
    { key: 'attendance',label: 'Attendance', icon: <CalendarCheck size={18} /> },
    { key: 'schedule',  label: 'Schedule',   icon: <Clock size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <StudentDashboard studentInfo={studentInfo} />;
      case 'grades':     return <StudentGrades />;
      case 'attendance': return <StudentAttendance />;
      case 'schedule':   return <StudentSchedule />;
      default:           return <StudentGrades />;
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
            <ChevronDown size={16} className={`profile-caret ${profileMenuOpen ? 'open' : ''}`} />
          </div>

          {profileMenuOpen && (
            <div className="profile-dropdown">
              <button
                className="profile-dropdown-item"
                onClick={() => { setActiveTab('dashboard'); setProfileMenuOpen(false); }}
              >
                <User size={15} /> View Profile
              </button>
              <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="student-main">
        <section className="student-hero-card">
          <div className="student-hero-icon"><GraduationCap size={36} color="#ffffff" /></div>
          <div>
            <h2>{studentInfo.gradeLevel}</h2>
            <p>Welcome back, {studentInfo.name}</p>
            <p>LRN: {studentInfo.lrn}</p>
            <p>School Year: {studentInfo.schoolYear}</p>
          </div>
        </section>

        <nav className="student-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="student-content">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default StudentLayout;