
import React, { useState, useEffect } from "react";
import Rating from "./Rating";
import LectureClasses from "./LectureClasses";
import { getClasses, getLecturesByClass, getRating } from "../api";
export default function StudentPortal({ user, onLogout, onNavigate }) {
  const [currentView, setCurrentView] = useState("portal");

  const [stats, setStats] = useState({
    totalLectures: 0,
    attendedLectures: 0,
    averageRating: 0,
    pendingRatings: 0
  });
  const [recentLectures, setRecentLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentView === "portal") {
      loadStudentData();
    }
  }, [currentView]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Get classes first (students should have access to their classes)
      const classes = await getClasses();
      
      // Get lectures for each class
      let allLectures = [];
      for (const cls of classes) {
        try {
          const classLectures = await getLecturesByClass(cls.id);
          allLectures = [...allLectures, ...classLectures];
        } catch (error) {
          console.error(`Error fetching lectures for class ${cls.id}:`, error);
        }
      }
      
      // Filter only past lectures
      const pastLectures = allLectures.filter(lecture => 
        lecture.date_of_lecture && new Date(lecture.date_of_lecture) <= new Date()
      );

      // Calculate student-specific statistics
      const totalLectures = pastLectures.length;
      const attendedLectures = pastLectures.filter(lec => 
        lec.actual_students_present > 0
      ).length;
      
      // Calculate average rating given by student
      const ratingPromises = pastLectures.map(lecture => getRating(lecture.id));
      const ratings = await Promise.all(ratingPromises);
      const validRatings = ratings.filter(rating => rating && rating.average_rating);
      const averageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, rating) => sum + parseFloat(rating.average_rating), 0) / validRatings.length
        : 0;

      // Get recent lectures (last 3)
      const recent = pastLectures.slice(0, 3).map(lec => ({
        id: lec.id,
        title: lec.course_name,
        date: lec.date_of_lecture,
        lecturer: lec.lecturer_name,
        attendance: `${lec.actual_students_present || 0}/${lec.total_registered_students || 0}`
      }));

      setStats({
        totalLectures,
        attendedLectures,
        averageRating: Math.round(averageRating * 10) / 10,
        pendingRatings: Math.max(0, totalLectures - validRatings.length)
      });
      setRecentLectures(recent);
    } catch (error) {
      console.error("Failed to load student data:", error);
      // Set default stats if loading fails
      setStats({
        totalLectures: 0,
        attendedLectures: 0,
        averageRating: 0,
        pendingRatings: 0
      });
      setRecentLectures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (page) => {
    if (page === "rating" || page === "monitoring") {
      setCurrentView(page);
    } else if (typeof onNavigate === 'function') {
      onNavigate(page);
    } else {
      setCurrentView(page);
    }
  };

  // Remove the unused handleRateLectures function that was causing the postFeedback error
  const handleRateLecture = () => {
    handleNavigation("rating");
  };

  const renderContent = () => {
    switch (currentView) {
      case "rating":
        return <Rating user={user} onNavigate={handleNavigation} />;
      case "monitoring":
        return <LectureClasses user={user} onNavigate={handleNavigation} />;
      default:
        return (
          <div className="student-portal">
            {/* Header */}
            <div className="content-header">
              <div className="header-left">
                <h1>Student Portal</h1>
                <p>Welcome to your learning dashboard</p>
              </div>
              <div className="header-right">
                <div className="user-welcome">
                  <span>Hello, <strong>{user.name}</strong></span>
                  <button className="btn btn-outline" onClick={onLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="portal-content">
              {/* Quick Stats */}
              <div className="stats-overview">
                <div className="stat-card">
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalLectures}</div>
                    <div className="stat-label">Total Lectures</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <div className="stat-value">{stats.attendedLectures}</div>
                    <div className="stat-label">Lectures Attended</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <div className="stat-value">{stats.averageRating}/5</div>
                    <div className="stat-label">Avg. Rating Given</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <div className="stat-value">{stats.pendingRatings}</div>
                    <div className="stat-label">Pending Ratings</div>
                  </div>
                </div>
              </div>

              {/* Welcome Section */}
              <div className="welcome-section">
                <div className="welcome-card">
                  <div className="welcome-header">
                    <div className="welcome-text">
                      <h1>Welcome back, {user.name}!</h1>
                      <p className="user-role">STUDENT PORTAL</p>
                      <p className="welcome-message">
                        Ready to continue your learning journey? Check your recent lectures, 
                        provide feedback, and monitor your academic progress.
                      </p>
                    </div>
                    <div className="welcome-graphic">
                      <div className="profile-picture">
                        <img 
                          src="/images/profile.jpg" 
                          alt="Student Profile" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="profile-fallback"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Actions Grid */}
              <div className="actions-section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="portal-menu">
                  <div className="menu-card primary" onClick={handleRateLecture}>
                    <div className="card-content">
                      <h3>Rate Lectures</h3>
                      <p>Provide feedback and ratings for your recent lectures. Help improve teaching quality.</p>
                      <div className="card-badge">
                        {stats.pendingRatings} pending
                      </div>
                    </div>
                    <div className="card-arrow">→</div>
                  </div>
                  
                  <div className="menu-card secondary" onClick={() => handleNavigation("monitoring")}>
                    <div className="card-content">
                      <h3>View Monitoring</h3>
                      <p>Monitor lecture reports, attendance records, and academic performance metrics.</p>
                      <div className="card-badge">
                        Updated daily
                      </div>
                    </div>
                    <div className="card-arrow">→</div>
                  </div>

                  <div className="menu-card info">
                    <div className="card-content">
                      <h3>Academic Progress</h3>
                      <p>Track your attendance rate and engagement across all courses and lectures.</p>
                      <div className="progress-stats">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${stats.totalLectures > 0 ? (stats.attendedLectures / stats.totalLectures) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {stats.totalLectures > 0 ? Math.round((stats.attendedLectures / stats.totalLectures) * 100) : 0}% Attendance
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="menu-card success">
                    <div className="card-content">
                      <h3>Learning Goals</h3>
                      <p>Set and track your academic goals for this semester. Stay motivated and focused.</p>
                      <div className="goals-list">
                        <div className="goal-item">Complete all assignments</div>
                        <div className="goal-item">Maintain 85%+ attendance</div>
                        <div className="goal-item pending">Participate in 3+ discussions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h2 className="section-title">Recent Lectures</h2>
                <div className="activity-list">
                  {recentLectures.map(lecture => (
                    <div key={lecture.id} className="activity-card">
                      <div className="activity-content">
                        <h4>{lecture.title}</h4>
                        <p>By {lecture.lecturer} • {new Date(lecture.date).toLocaleDateString()}</p>
                        <div className="activity-meta">
                          <span className="attendance-badge">Attendance: {lecture.attendance}</span>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={handleRateLecture}
                          >
                            Rate Lecture
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentLectures.length === 0 && !loading && (
                    <div className="no-activity">
                      <h3>No Recent Lectures</h3>
                      <p>Your recent lecture activity will appear here.</p>
                    </div>
                  )}
                  {loading && (
                    <div className="loading-activity">
                      <div className="loading-spinner"></div>
                      <p>Loading recent lectures...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="tips-section">
                <h2 className="section-title">Student Tips</h2>
                <div className="tips-grid">
                  <div className="tip-card">
                    <h4>Regular Feedback</h4>
                    <p>Provide timely feedback after each lecture to help lecturers improve their teaching methods.</p>
                  </div>
                  <div className="tip-card">
                    <h4>Track Attendance</h4>
                    <p>Monitor your attendance regularly to ensure you meet course requirements.</p>
                  </div>
                  <div className="tip-card">
                    <h4>Set Goals</h4>
                    <p>Set clear academic goals for each semester and track your progress.</p>
                  </div>
                  <div className="tip-card">
                    <h4>Engage Actively</h4>
                    <p>Participate in class discussions and activities for better learning outcomes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="portal-container">
      <style jsx>{`
        .portal-container {
          display: flex;
          min-height: 100vh;
          background: #000;
        }

        .sidenav {
          width: 220px;
          background: white;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .sidenav-header {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          padding: 2rem 1.5rem;
          color: white;
          margin-bottom: 1rem;
        }

        .sidenav-title {
          font-size: 1.3rem;
          font-weight: bold;
          color: #fff;
          margin: 0;
        }

        .sidenav-subtitle {
          color: #ccc;
          margin: 0.5rem 0 0 0;
          font-size: 0.8rem;
        }

        .nav-content {
          padding: 0 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 1rem 1rem;
          color: #333;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          font-size: 0.9rem;
        }

        .nav-link:hover {
          background: #f8f9fa;
          color: #000;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #000 0%, #333 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .nav-link .icon {
          margin-right: 0.75rem;
          font-size: 1.1rem;
        }

        .logout-section {
          margin-top: auto;
          padding: 1.5rem;
          border-top: 1px solid #e9ecef;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn-outline {
          background: transparent;
          border: 2px solid #333;
          color: #333;
          width: 100%;
        }

        .btn-outline:hover {
          background: #333;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
        }

        .main-content {
          flex: 1;
          background: #000;
          padding: 2rem;
          overflow-y: auto;
        }

        .student-portal {
          color: white;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #333;
        }

        .header-left h1 {
          margin: 0;
          font-size: 2.5rem;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-left p {
          margin: 0.5rem 0 0 0;
          color: #999;
        }

        .user-welcome {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-welcome span {
          color: #fff;
        }

        .user-welcome .btn-outline {
          width: auto;
          border: 2px solid #fff;
          color: #fff;
        }

        .user-welcome .btn-outline:hover {
          background: #fff;
          color: #000;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #333;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #999;
          font-size: 0.9rem;
        }

        .welcome-section {
          margin-bottom: 3rem;
        }

        .welcome-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid #333;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-text h1 {
          margin: 0;
          font-size: 2.5rem;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .user-role {
          color: #666;
          font-weight: bold;
          margin: 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 0.8rem;
        }

        .welcome-message {
          color: #ccc;
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 500px;
        }

        .profile-picture {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid #333;
          overflow: hidden;
          position: relative;
        }

        .profile-picture img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .profile-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #333 0%, #000 100%);
          border-radius: 50%;
          display: none;
        }

        .section-title {
          font-size: 1.8rem;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .portal-menu {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .menu-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #333;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .menu-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          border-color: #666;
        }

        .menu-card.primary:hover {
          border-color: #007bff;
        }

        .menu-card.secondary:hover {
          border-color: #6c757d;
        }

        .card-content h3 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
          color: #fff;
        }

        .card-content p {
          color: #ccc;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .card-badge {
          background: linear-gradient(135deg, #333 0%, #000 100%);
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          border: 1px solid #444;
        }

        .progress-stats {
          margin-top: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          color: #ccc;
          font-size: 0.9rem;
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .goal-item {
          background: #1a1a1a;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #333;
          color: #fff;
          font-size: 0.9rem;
        }

        .goal-item.pending {
          color: #999;
          border-style: dashed;
        }

        .card-arrow {
          font-size: 1.5rem;
          color: #666;
          transition: transform 0.3s ease;
        }

        .menu-card:hover .card-arrow {
          transform: translateX(5px);
          color: #fff;
        }

        .activity-list {
          display: grid;
          gap: 1.5rem;
        }

        .activity-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #333;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .activity-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .activity-content h4 {
          margin: 0 0 0.5rem 0;
          color: #fff;
          font-size: 1.2rem;
        }

        .activity-content p {
          color: #ccc;
          margin: 0 0 1.5rem 0;
        }

        .activity-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .attendance-badge {
          background: #333;
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .no-activity, .loading-activity {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top: 3px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .tip-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #333;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .tip-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .tip-card h4 {
          margin: 0 0 1rem 0;
          color: #fff;
          font-size: 1.1rem;
        }

        .tip-card p {
          color: #ccc;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>

      {/* Left Side Navigation */}
      <div className="sidenav">
        {/* Dark Gradient Header Section */}
        <div className="sidenav-header">
          <h2 className="sidenav-title">Student Portal</h2>
          <p className="sidenav-subtitle">Learning Management System</p>
        </div>
        
        <div className="nav-content">
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === "portal" ? "active" : ""}`}
              onClick={() => setCurrentView("portal")}
            >
            
            Dashboard
            </button>

            <button
              className={`nav-link ${currentView === "rating" ? "active" : ""}`}
              onClick={handleRateLecture}
            >
            Rating
            </button>

            <button
              className={`nav-link ${currentView === "monitoring" ? "active" : ""}`}
              onClick={() => handleNavigation("monitoring")}
            >
            Monitoring
            </button>
          </div>

          <div className="logout-section">
            <button className="btn btn-outline" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}