import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Layout.css';
import TopNavbar from './topnavbar';
import { LayoutDashboard, FolderKanban, UsersRound, Settings2Icon } from 'lucide-react';

const Layout = ({ children, currentPage, setCurrentPage }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/auth');
  };
  return (
    <div className="layout">
      {/* Side Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/src/assets/logo.png" alt="Summit Ridge Logo" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-title">
            <h2>Summit Ridge</h2>
            <p>Campus Portal</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon"><LayoutDashboard size={24} /></span>
            Dashboard
          </button>
          <button 
            className={`nav-item ${currentPage === 'subjects' ? 'active' : ''}`}
            onClick={() => setCurrentPage('subjects')}
          >
            <span className="nav-icon"><FolderKanban size={24} /></span>
            Manage Subjects
          </button>
          <button 
            className={`nav-item ${currentPage === 'students' ? 'active' : ''}`}
            onClick={() => setCurrentPage('students')}
          >
            <span className="nav-icon"><UsersRound size={24} /></span>
            Students
          </button>
          <button 
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="nav-icon"><Settings2Icon size={24} /></span>
            Profile Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navigation - Hide on Profile Settings */}
        {currentPage !== 'settings' && <TopNavbar />}

        {/* Page Content */}
        <main className={`page-content ${currentPage === 'settings' ? 'no-navbar' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
