import React, { useState, useEffect } from 'react';
import '../../css/topnavbar.css';

const TopNavbar = () => {
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    // Get user profile from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserProfile({
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
        });
      } catch (err) {
        console.error('Error parsing user profile:', err);
      }
    }
  }, []);

  // Generate initials from first and last names
  const getInitials = () => {
    const firstInitial = userProfile.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = userProfile.lastName?.charAt(0)?.toUpperCase() || '';
    return (firstInitial + lastInitial).substring(0, 2);
  };

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <h1>Summit Ridge Campus</h1>
        <span className="badge">Elementary</span>
      </div>
      <div className="top-nav-right">
        <div className="user-info">
          <div className="user-details">
            <p className="user-name">
              Prof. {userProfile.firstName} {userProfile.lastName}
            </p>
          </div>
          <div className="user-avatar">
            <span>{getInitials()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
