import React from 'react';
import '../../css/topnavbar.css';

const TopNavbar = () => {
  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <h1>Summit Ridge Campus</h1>
        <span className="badge">Elementary</span>
      </div>
      <div className="top-nav-right">
        <div className="user-info">
          <div className="user-details">
            <p className="user-name">Prof. Maria Santos</p>
          </div>
          <div className="user-avatar">
            <span>MS</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
