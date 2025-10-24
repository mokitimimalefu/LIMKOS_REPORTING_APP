import React, { useState } from "react";

export default function TopNavigation({ user, selected, onSelect, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  let menuItems = [];

  if (user.role === "student") {
    menuItems = [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Monitoring", label: "Lecture Monitoring" },
      { key: "Rating", label: "Rate Lectures" }
    ];
  } else if (user.role === "lecturer") {
    menuItems = [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Lectures", label: "Submit Lecture" },
      { key: "My Classes", label: "My Classes" },
      { key: "Lecture Report", label: "My Reports" },
      { key: "Monitoring", label: "Monitoring" },
      { key: "Rating", label: "Student Ratings" }
    ];
  } else if (user.role === "principal_lecturer") {
    menuItems = [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Lectures", label: "Lectures" },
      { key: "Principal Report", label: "Institution Report" },
      { key: "Monitoring", label: "Monitoring" },
      { key: "Classes", label: "Classes" },
      { key: "Courses", label: "Courses" }
    ];
  } else if (user.role === "program_leader") {
    menuItems = [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Program Report", label: "Program Report" },
      { key: "Courses", label: "Courses" },
      { key: "Monitoring", label: "Monitoring" },
      { key: "Classes", label: "Classes" }
    ];
  } else if (user.role === "admin") {
    menuItems = [
      { key: "Dashboard", label: "Dashboard" },
      { key: "Lectures", label: "Lectures" },
      { key: "Classes", label: "Classes" },
      { key: "Courses", label: "Courses" },
      { key: "Reports", label: "Reports" },
      { key: "Monitoring", label: "Monitoring" },
      { key: "Rating", label: "Ratings" }
    ];
  }

  const getRoleDisplay = (role) => {
    return role.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="top-navigation">
      <div className="nav-header">
        <div className="logo-section">
          <div className="university-logo">
            <div className="logo-placeholder">LIMKOKWING UNIVERSITY</div>
          </div>
          <div className="system-name">LIMKOKWING REPORT SYSTEM</div>
        </div>
        
        <div className="nav-main">
          <div className="nav-menu">
            {menuItems.map(item => (
              <button
                key={item.key}
                className={`nav-item ${selected === item.key ? 'active' : ''}`}
                onClick={() => onSelect(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="user-section">
          <div 
            className="user-info"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{getRoleDisplay(user.role)}</div>
            </div>
            <div className="user-avatar">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-item">
                  <div className="user-email">{user.email}</div>
                </div>
                <div className="user-menu-divider"></div>
                <button 
                  className="user-menu-item logout-btn"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}