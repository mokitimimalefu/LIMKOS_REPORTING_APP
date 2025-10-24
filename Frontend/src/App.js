import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import StudentPortal from "./components/StudentPortal";
import Rating from "./components/Rating";
import Dashboard from "./components/Dashboard";
import ClassManagement from "./components/ClassManagement";
import CourseManagement from "./components/CourseManagement";
import ProgramLeaderReport from "./components/ProgramLeaderReport";
import { getCurrentUser } from "./api";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'student') {
      setCurrentPage("studentPortal");
    } else {
      setCurrentPage("dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("home");
  };

  const handleNavigate = (page, role = null) => {
    setCurrentPage(page);
    if (role) {
      setSelectedRole(role);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={handleNavigate} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />;
      case "login":
        return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
      case "register":
        return <Register onNavigate={handleNavigate} />;
      case "studentPortal":
        return user ? <StudentPortal user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : <Home onNavigate={handleNavigate} />;
      case "rating":
        return user ? <Rating user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : <Home onNavigate={handleNavigate} />;
      case "dashboard":
        return user ? <Dashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} /> : <Home onNavigate={handleNavigate} />;
      case "classManagement":
        return user ? <ClassManagement /> : <Home onNavigate={handleNavigate} />;
      case "courseManagement":
        return user ? <CourseManagement /> : <Home onNavigate={handleNavigate} />;
      case "programLeaderReport":
        return user ? <ProgramLeaderReport /> : <Home onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Edura System...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {renderPage()}
    </div>
  );
}

export default App;