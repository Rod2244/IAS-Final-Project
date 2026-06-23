import React from 'react';
import { Users, Book, FileText, CheckCircle } from 'lucide-react';
import '../../css/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome Back, Professor!</h1>
        <p>Here's an overview of your classes and students</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <p className="stat-number">45</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Book size={32} />
          </div>
          <div className="stat-info">
            <h3>Subjects</h3>
            <p className="stat-number">6</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <FileText size={32} />
          </div>
          <div className="stat-info">
            <h3>Classes</h3>
            <p className="stat-number">2</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <CheckCircle size={32} />
          </div>
          <div className="stat-info">
            <h3>Grades Submitted</h3>
            <p className="stat-number">89%</p>
          </div>
        </div>
      </div>

      <div className="content-section full-width">
        <h2>Class Overview</h2>
        <div className="class-cards">
          <div className="class-card">
            <div className="class-header">
              <h3>Grade 3 - Class A</h3>
              <span className="class-badge">Morning</span>
            </div>
            <div className="class-stats">
              <div className="class-stat">
                <span className="label">Students:</span>
                <span className="value">23</span>
              </div>
              <div className="class-stat">
                <span className="label">Subjects:</span>
                <span className="value">6</span>
              </div>
              <div className="class-stat">
                <span className="label">Avg Grade:</span>
                <span className="value">88%</span>
              </div>
            </div>
          </div>

          <div className="class-card">
            <div className="class-header">
              <h3>Grade 3 - Class B</h3>
              <span className="class-badge">Afternoon</span>
            </div>
            <div className="class-stats">
              <div className="class-stat">
                <span className="label">Students:</span>
                <span className="value">22</span>
              </div>
              <div className="class-stat">
                <span className="label">Subjects:</span>
                <span className="value">6</span>
              </div>
              <div className="class-stat">
                <span className="label">Avg Grade:</span>
                <span className="value">85%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
