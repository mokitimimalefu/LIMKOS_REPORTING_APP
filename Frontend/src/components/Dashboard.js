// Dashboard.js
import React, { useState, useEffect, useCallback } from "react";
import LectureForm from "./LectureForm";
import LectureReport from "./LectureReport";
import Monitoring from "./Monitoring";
import Rating from "./Rating";
import PrincipalReport from "./PrincipalReport";
import ProgramLeaderReport from "./ProgramLeaderReport";
import CourseManagement from "./CourseManagement";
import ClassManagement from "./ClassManagement";
import ReportsList from "./ReportsList";
import LectureClasses from "./LectureClasses";
import {
  getAssignmentsByLecturer,
  getClassById,
  fetchLectures,
  getCoursesByProgramLeader,
  getLecturesByLecturer,
  getRatingsByLecturer,
  getPrincipalReports,
  getProgramStudents,
  getFacultyByProgram,
  getUsersByRole,
  getClasses,
  getCourses
} from "../api";

// Updated Image URLs for the dashboard with new images
const IMAGES = {
  universityLogo: "https://images.unsplash.com/photo-1562813733-b31f71025d54?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center",
  userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=face",
  lecturerWelcome: "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
  principalWelcome: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
  programLeaderWelcome: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=200&q=80",
  adminWelcome: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
  classroomIcon: "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
  lectureIcon: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
  studentsIcon: "https://images.unsplash.com/photo-1584697964358-3e14ca57658b?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
  ratingIcon: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
  submitLecture: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  viewClasses: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  monitoring: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  facultyOverview: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
  academicQuality: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
  courseManagement: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  studentProgress: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  userManagement: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  reporting: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&w=300&h=150&fit=crop",
  loadingGif: "https://images.unsplash.com/photo-1611267254323-4db7b39c732c?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center"
};

export default function Dashboard({ user, onLogout, onNavigate }) {
  const [selected, setSelected] = useState("Dashboard");

  const renderContent = () => {
    if (user.role === "student") {
      return <div className="redirect-message">Redirecting to Student Portal...</div>;
    } else if (user.role === "lecturer") {
      switch (selected) {
        case "Dashboard":
          return <LecturerDashboard user={user} />;
        case "Lectures":
          return <LectureForm user={user} />;
        case "My Classes":
          return <LectureClasses user={user} onNavigate={setSelected} />;
        case "Lecture Report":
          return <LectureReport user={user} />;
        case "Monitoring":
          return <Monitoring user={user} />;
        case "Rating":
          return <Rating user={user} />;
        default:
          return <LecturerDashboard user={user} />;
      }
    } else if (user.role === "principal_lecturer") {
      switch (selected) {
        case "Dashboard":
          return <PrincipalDashboard user={user} />;
        case "Lectures":
          return <LecturesList user={user} />;
        case "Principal Report":
          return <PrincipalReport user={user} />;
        case "Monitoring":
          return <Monitoring user={user} />;
        case "Classes":
          return <ClassManagement user={user} />;
        case "Courses":
          return <CourseManagement user={user} />;
        case "Rating":
          return <Rating user={user} />;
        default:
          return <PrincipalDashboard user={user} />;
      }
    } else if (user.role === "program_leader") {
      switch (selected) {
        case "Dashboard":
          return <ProgramDashboard user={user} />;
        case "Program Report":
          return <ProgramLeaderReport />;
        case "Courses":
          return <CourseManagement user={user} />;
        case "Monitoring":
          return <Monitoring user={user} />;
        case "Classes":
          return <ClassManagement user={user} />;
        case "Lectures":
          return <LecturesList user={user} />;
        case "Rating":
          return <Rating user={user} />;
        default:
          return <ProgramDashboard user={user} />;
      }
    } else if (user.role === "admin") {
      switch (selected) {
        case "Dashboard":
          return <AdminDashboard user={user} />;
        case "Lectures":
          return <LecturesList user={user} />;
        case "Classes":
          return <ClassManagement user={user} />;
        case "Courses":
          return <CourseManagement user={user} />;
        case "Reports":
          return <ReportsList user={user} />;
        case "Monitoring":
          return <Monitoring user={user} />;
        case "Rating":
          return <Rating user={user} />;
        default:
          return <AdminDashboard user={user} />;
      }
    }
    return <div className="error-message">Role not recognized</div>;
  };

  return (
    <div className="portal-container">
      {/* Left Side Navigation */}
      <div className="sidenav">
        <div className="sidenav-header">
          <h2 className="sidenav-title">
            {user.role === "lecturer" ? "Lecturer Portal" : 
             user.role === "principal_lecturer" ? "Principal Portal" :
             user.role === "program_leader" ? "Program Portal" : "Admin Portal"}
          </h2>
          <p className="sidenav-subtitle">Academic Management System</p>
        </div>
        
        <div className="nav-content">
          <div className="nav-links">
            {user.role === "lecturer" && (
              <>
                <button 
                  className={`nav-link ${selected === "Dashboard" ? "active" : ""}`}
                  onClick={() => setSelected("Dashboard")}
                >
                  
                  Dashboard
                </button>
                <button 
                  className={`nav-link ${selected === "Lectures" ? "active" : ""}`}
                  onClick={() => setSelected("Lectures")}
                >
                  
                  Reports
                </button>
                <button 
                  className={`nav-link ${selected === "My Classes" ? "active" : ""}`}
                  onClick={() => setSelected("My Classes")}
                >
                  
                  Classes
                </button>
                
                <button 
                  className={`nav-link ${selected === "Monitoring" ? "active" : ""}`}
                  onClick={() => setSelected("Monitoring")}
                >
                  
                  Monitoring
                </button>
                <button 
                  className={`nav-link ${selected === "Rating" ? "active" : ""}`}
                  onClick={() => setSelected("Rating")}
                >
                  
                  Ratings
                </button>
              </>
            )}
            {user.role === "principal_lecturer" && (
              <>
                <button 
                  className={`nav-link ${selected === "Dashboard" ? "active" : ""}`}
                  onClick={() => setSelected("Dashboard")}
                >
                  
                  Dashboard
                </button>
                <button 
                  className={`nav-link ${selected === "Lectures" ? "active" : ""}`}
                  onClick={() => setSelected("Lectures")}
                >
                  
                  Lectures
                </button>
                <button 
                  className={`nav-link ${selected === "Principal Report" ? "active" : ""}`}
                  onClick={() => setSelected("Principal Report")}
                >
                  
                  Report
                </button>
                <button 
                  className={`nav-link ${selected === "Monitoring" ? "active" : ""}`}
                  onClick={() => setSelected("Monitoring")}
                >
                  
                  Monitoring
                </button>
                <button 
                  className={`nav-link ${selected === "Classes" ? "active" : ""}`}
                  onClick={() => setSelected("Classes")}
                >
                  
                  Classes
                </button>
                <button 
                  className={`nav-link ${selected === "Courses" ? "active" : ""}`}
                  onClick={() => setSelected("Courses")}
                >
                  
                  Courses
                </button>
                <button 
                  className={`nav-link ${selected === "Rating" ? "active" : ""}`}
                  onClick={() => setSelected("Rating")}
                >
                  
                  Ratings
                </button>
              </>
            )}
            {user.role === "program_leader" && (
              <>
                <button 
                  className={`nav-link ${selected === "Dashboard" ? "active" : ""}`}
                  onClick={() => setSelected("Dashboard")}
                >
                  
                  Dashboard
                </button>
                
                <button 
                  className={`nav-link ${selected === "Courses" ? "active" : ""}`}
                  onClick={() => setSelected("Courses")}
                >
                  
                  Courses
                </button>
                <button 
                  className={`nav-link ${selected === "Monitoring" ? "active" : ""}`}
                  onClick={() => setSelected("Monitoring")}
                >
                  
                  Monitoring
                </button>
                <button 
                  className={`nav-link ${selected === "Classes" ? "active" : ""}`}
                  onClick={() => setSelected("Classes")}
                >
                  
                  Classes
                </button>
                <button 
                  className={`nav-link ${selected === "Program Report" ? "active" : ""}`}
                  onClick={() => setSelected("Program Report")}
                >
                  
                  Report
                </button>
                
                <button 
                  className={`nav-link ${selected === "Rating" ? "active" : ""}`}
                  onClick={() => setSelected("Rating")}
                >
                  
                  Ratings
                </button>
              </>
            )}
            {user.role === "admin" && (
              <>
                <button 
                  className={`nav-link ${selected === "Dashboard" ? "active" : ""}`}
                  onClick={() => setSelected("Dashboard")}
                >
                  
                  Dashboard
                </button>
                <button 
                  className={`nav-link ${selected === "Lectures" ? "active" : ""}`}
                  onClick={() => setSelected("Lectures")}
                >
                  
                  Lectures
                </button>
                <button 
                  className={`nav-link ${selected === "Classes" ? "active" : ""}`}
                  onClick={() => setSelected("Classes")}
                >
                 
                  Classes
                </button>
                <button 
                  className={`nav-link ${selected === "Courses" ? "active" : ""}`}
                  onClick={() => setSelected("Courses")}
                >
                  
                  Courses
                </button>
                <button 
                  className={`nav-link ${selected === "Reports" ? "active" : ""}`}
                  onClick={() => setSelected("Reports")}
                >
                  
                  Reports
                </button>
                <button 
                  className={`nav-link ${selected === "Monitoring" ? "active" : ""}`}
                  onClick={() => setSelected("Monitoring")}
                >
                  
                  Monitoring
                </button>
                <button 
                  className={`nav-link ${selected === "Rating" ? "active" : ""}`}
                  onClick={() => setSelected("Rating")}
                >
                  
                  Ratings
                </button>
              </>
            )}
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

      <style jsx>{`
        
      `}</style>
    </div>
  );
}

// Enhanced Dashboard Components with Real Data
function LecturerDashboard({ user }) {
  const [stats, setStats] = useState({
    totalClasses: 0,
    upcomingLectures: 0,
    studentsTaught: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  const loadLecturerData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch assignments to get classes
      const assignments = await getAssignmentsByLecturer(user.id);
      const classIds = [...new Set(assignments.map(a => a.class_id))];
      
      // Fetch lectures by lecturer
      const lectures = await getLecturesByLecturer(user.id);
      
      // Fetch ratings
      const ratings = await getRatingsByLecturer(user.id);
      
      // Calculate stats
      const totalClasses = classIds.length;
      const upcomingLectures = lectures.filter(lecture => {
        const lectureDate = new Date(lecture.date_of_lecture);
        return lectureDate > new Date();
      }).length;
      
      // Calculate total students from classes
      const classPromises = classIds.map(id => getClassById(id));
      const classesData = await Promise.all(classPromises);
      const studentsTaught = classesData.reduce((sum, cls) => 
        sum + (cls.total_registered_students || 0), 0
      );
      
      // Calculate average rating
      const averageRating = ratings.length > 0 
        ? (ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / ratings.length).toFixed(1)
        : 0;

      setStats({
        totalClasses,
        upcomingLectures,
        studentsTaught,
        averageRating: parseFloat(averageRating)
      });
    } catch (error) {
      console.error("Failed to load lecturer data:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadLecturerData();
  }, [loadLecturerData]);

  if (loading) {
    return (
      <div className="loading-container">
        <img src={IMAGES.loadingGif} alt="Loading" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="welcome-banner">
        <img 
          src={IMAGES.lecturerWelcome}
          alt="Lecturer at work" 
          className="welcome-image"
        />
        <div className="welcome-content">
          <h1>Welcome Back, Professor {user.name}</h1>
          <p>Your academic dashboard provides an overview of your teaching activities, class performance, and upcoming schedules.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Classes</h3>
            <div className="stat-value">{stats.totalClasses}</div>
            <p>Active classes this semester</p>
          </div>
          <img 
            src={IMAGES.classroomIcon}
            alt="Classroom" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Upcoming Lectures</h3>
            <div className="stat-value">{stats.upcomingLectures}</div>
            <p>Scheduled for this week</p>
          </div>
          <img 
            src={IMAGES.lectureIcon}
            alt="Lecture" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Students Taught</h3>
            <div className="stat-value">{stats.studentsTaught}</div>
            <p>Across all your courses</p>
          </div>
          <img 
            src={IMAGES.studentsIcon}
            alt="Students" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Average Rating</h3>
            <div className="stat-value">{stats.averageRating}/5.0</div>
            <p>Based on student feedback</p>
          </div>
          <img 
            src={IMAGES.ratingIcon}
            alt="Rating" 
            className="stat-image"
          />
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card">
            <img src={IMAGES.submitLecture} alt="Submit Lecture" />
            <h4>Submit Lecture Report</h4>
            <p>Record today's teaching activities and attendance</p>
          </div>
          <div className="action-card">
            <img src={IMAGES.viewClasses} alt="View Classes" />
            <h4>View My Classes</h4>
            <p>Check your assigned classes and schedules</p>
          </div>
          <div className="action-card">
            <img src={IMAGES.monitoring} alt="Monitoring" />
            <h4>Lecture Monitoring</h4>
            <p>Monitor ongoing lectures and student participation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrincipalDashboard({ user }) {
  const [institutionStats, setInstitutionStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPrincipalData = useCallback(async () => {
    try {
      setLoading(true);
      const reports = await getPrincipalReports();
      setInstitutionStats(reports.institutionStats);
    } catch (error) {
      console.error("Failed to load principal data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrincipalData();
  }, [loadPrincipalData]);

  if (loading) {
    return (
      <div className="loading-container">
        <img src={IMAGES.loadingGif} alt="Loading" />
        <p>Loading institutional data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="welcome-banner">
        <img 
          src={IMAGES.principalWelcome}
          alt="Academic Leadership" 
          className="welcome-image"
        />
        <div className="welcome-content">
          <h1>Principal Dashboard</h1>
          <p className="welcome-subtitle">Welcome, {user.name}</p>
          <p>Comprehensive overview of institutional academic performance, faculty activities, and program analytics.</p>
        </div>
      </div>

      <div className="institutional-stats">
        <h2>Institutional Overview</h2>
        <div className="stats-grid">
          <div className="stat-card large">
            <img src={IMAGES.facultyOverview} alt="Faculty Overview" />
            <div className="stat-content">
              <h3>Faculty Performance</h3>
              <p>Monitor teaching effectiveness across all departments and programs</p>
              <div className="stat-details">
                <span>{institutionStats?.totalLecturers || 0} Active Lecturers</span>
                <span>{institutionStats?.totalFaculties || 0} Programs</span>
                <span>{institutionStats?.overallAttendance || 0}% Attendance Rate</span>
              </div>
            </div>
          </div>

          <div className="stat-card large">
            <img src={IMAGES.academicQuality} alt="Academic Quality" />
            <div className="stat-content">
              <h3>Academic Quality Metrics</h3>
              <p>Track student engagement, course completion rates, and learning outcomes</p>
              <div className="stat-details">
                <span>{institutionStats?.completionRate || 0}% Course Completion</span>
                <span>Avg. Class Size: {institutionStats?.averageClassSize || 0}</span>
                <span>Student-Teacher Ratio: {institutionStats?.studentTeacherRatio || 0}:1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramDashboard({ user }) {
  const [programData, setProgramData] = useState({
    students: 0,
    faculty: 0,
    courses: 0
  });
  const [loading, setLoading] = useState(true);

  const loadProgramData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [students, faculty, courses] = await Promise.all([
        getProgramStudents(user.id),
        getFacultyByProgram(user.id),
        getCoursesByProgramLeader(user.id)
      ]);

      setProgramData({
        students: students.length,
        faculty: faculty.length,
        courses: courses.length
      });
    } catch (error) {
      console.error("Failed to load program data:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadProgramData();
  }, [loadProgramData]);

  if (loading) {
    return (
      <div className="loading-container">
        <img src={IMAGES.loadingGif} alt="Loading" />
        <p>Loading program data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="welcome-banner">
        <img 
          src={IMAGES.programLeaderWelcome}
          alt="Program Leadership" 
          className="welcome-image"
        />
        <div className="welcome-content">
          <h1>Program Leader Dashboard</h1>
          <p className="welcome-subtitle">Welcome, {user.name}</p>
          <p>Manage your academic program, monitor course delivery, and analyze student performance across all courses in your program.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Students</h3>
            <div className="stat-value">{programData.students}</div>
            <p>Enrolled in your program</p>
          </div>
          <img 
            src={IMAGES.studentsIcon}
            alt="Students" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Faculty Members</h3>
            <div className="stat-value">{programData.faculty}</div>
            <p>Teaching in your program</p>
          </div>
          <img 
            src={IMAGES.lectureIcon}
            alt="Faculty" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Active Courses</h3>
            <div className="stat-value">{programData.courses}</div>
            <p>In your program curriculum</p>
          </div>
          <img 
            src={IMAGES.classroomIcon}
            alt="Courses" 
            className="stat-image"
          />
        </div>
      </div>

      <div className="program-highlights">
        <div className="highlight-card">
          <img src={IMAGES.courseManagement} alt="Course Management" />
          <div className="highlight-content">
            <h3>Course Coordination</h3>
            <p>Oversee course delivery, curriculum implementation, and teaching quality across your program.</p>
          </div>
        </div>

        <div className="highlight-card">
          <img src={IMAGES.studentProgress} alt="Student Progress" />
          <div className="highlight-content">
            <h3>Student Performance</h3>
            <p>Track academic progress, attendance patterns, and learning outcomes for program improvement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user }) {
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalClasses: 0,
    totalLectures: 0
  });
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [users, courses, classes, lectures] = await Promise.all([
        getUsersByRole('all'),
        getCourses(),
        getClasses(),
        fetchLectures()
      ]);

      setAdminStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalClasses: classes.length,
        totalLectures: lectures.length
      });
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  if (loading) {
    return (
      <div className="loading-container">
        <img src={IMAGES.loadingGif} alt="Loading" />
        <p>Loading system data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="welcome-banner">
        <img 
          src={IMAGES.adminWelcome}
          alt="System Administration" 
          className="welcome-image"
        />
        <div className="welcome-content">
          <h1>System Administration</h1>
          <p className="welcome-subtitle">Welcome, {user.name}</p>
          <p>Complete system oversight with access to all academic data, user management, and institutional reporting capabilities.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-value">{adminStats.totalUsers}</div>
            <p>System-wide users</p>
          </div>
          <img 
            src={IMAGES.userManagement}
            alt="Users" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Courses</h3>
            <div className="stat-value">{adminStats.totalCourses}</div>
            <p>Active courses</p>
          </div>
          <img 
            src={IMAGES.courseManagement}
            alt="Courses" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Classes</h3>
            <div className="stat-value">{adminStats.totalClasses}</div>
            <p>Scheduled classes</p>
          </div>
          <img 
            src={IMAGES.classroomIcon}
            alt="Classes" 
            className="stat-image"
          />
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Lectures</h3>
            <div className="stat-value">{adminStats.totalLectures}</div>
            <p>Recorded lectures</p>
          </div>
          <img 
            src={IMAGES.lectureIcon}
            alt="Lectures" 
            className="stat-image"
          />
        </div>
      </div>

      <div className="admin-features">
        <h2>System Management</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src={IMAGES.userManagement} alt="User Management" />
            <h4>User Management</h4>
            <p>Manage all system users including lecturers, students, and administrative staff</p>
          </div>
          <div className="feature-card">
            <img src={IMAGES.courseManagement} alt="Course Management" />
            <h4>Course Administration</h4>
            <p>Oversee course creation, modification, and program assignments</p>
          </div>
          <div className="feature-card">
            <img src={IMAGES.reporting} alt="Reporting" />
            <h4>Comprehensive Reporting</h4>
            <p>Generate institutional reports and analytics across all departments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LecturesList({ user }) {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLectures = useCallback(async () => {
    try {
      setLoading(true);
      let allLectures = await fetchLectures();

      if (user.role === "lecturer") {
        // Filter lectures by lecturer
        allLectures = allLectures.filter(lec => lec.lecturer_id === user.id);
      } else if (user.role === "program_leader") {
        // Filter by courses under program leader
        const programCourses = await getCoursesByProgramLeader(user.id);
        const courseIds = programCourses.map(c => c.id);
        allLectures = allLectures.filter(lec => courseIds.includes(lec.course_id));
      }
      // Admin and principal see all lectures

      setLectures(allLectures);
    } catch (error) {
      console.error("Failed to load lectures:", error);
    } finally {
      setLoading(false);
    }
  }, [user.role, user.id]);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  if (loading) {
    return (
      <div className="loading-container">
        <img src={IMAGES.loadingGif} alt="Loading" />
        <p>Loading lecture data...</p>
      </div>
    );
  }

  return (
    <div className="lectures-list">
      <div className="page-header">
        <h2>Lecture Records</h2>
        <p>Comprehensive view of all lecture activities across the institution</p>
      </div>
      
      <div className="lectures-table-container">
        <table className="lectures-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Class</th>
              <th>Lecturer</th>
              <th>Attendance</th>
              <th>Topic Covered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lectures.map(lec => (
              <tr key={lec.id}>
                <td>{lec.date_of_lecture}</td>
                <td>{lec.course_name}</td>
                <td>{lec.class_name}</td>
                <td>{lec.lecturer_name}</td>
                <td>
                  <div className="attendance-display">
                    <span className="attendance-count">
                      {lec.actual_students_present}/{lec.total_registered_students}
                    </span>
                    <div className="attendance-bar">
                      <div 
                        className="attendance-fill"
                        style={{
                          width: `${(lec.actual_students_present / lec.total_registered_students) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>{lec.topic_taught}</td>
                <td>
                  <span className={`status-badge ${lec.status || 'completed'}`}>
                    {lec.status || 'Completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}