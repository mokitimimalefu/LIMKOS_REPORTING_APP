import React, { useState, useEffect } from 'react'; 
import {
  generateProgramReport,
  getCoursesByProgramLeader,
  getCurrentUser,
  getProgramStudents,
  getFacultyByProgram
} from '../api';

const ProgramLeaderReport = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [timeRange, setTimeRange] = useState('current_semester');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    courses: true,
    faculty: true,
    students: true
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setSelectedProgram(currentUser.id.toString());
      fetchUserCourses(currentUser.id);
      fetchProgramStudents(currentUser.id);
      fetchProgramFaculty(currentUser.id);
    }
  }, [currentUser, timeRange]);

  const fetchUserCourses = async (programLeaderId) => {
    try {
      const userCourses = await getCoursesByProgramLeader(programLeaderId);
      setCourses(userCourses || []);
    } catch (error) {
      console.error("Failed to fetch user courses:", error);
      setCourses([]);
    }
  };

  const fetchProgramStudents = async (programLeaderId) => {
    try {
      const programStudents = await getProgramStudents(programLeaderId);
      setStudents(programStudents || []);
    } catch (error) {
      console.error("Failed to fetch program students:", error);
      setStudents([]);
    }
  };

  const fetchProgramFaculty = async (programLeaderId) => {
    try {
      const programFaculty = await getFacultyByProgram(programLeaderId);
      setFaculty(programFaculty || []);
    } catch (error) {
      console.error("Failed to fetch program faculty:", error);
      setFaculty([]);
    }
  };

  const handleGenerateReport = async (reportType) => {
    try {
      setGenerating(true);
      setMessage('');
      const response = await generateProgramReport(selectedProgram, reportType, timeRange);
      setMessage(`${response.message}`);
      if (response.downloadUrl) window.open(response.downloadUrl, '_blank');
    } catch (error) {
      console.error("Failed to generate program report:", error);
      setMessage("Failed to generate program report");
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderStars = (rating) => {
    const normalizedRating = Math.min(5, Math.max(0, rating || 0));
    return [1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        className={`star ${star <= normalizedRating ? 'filled' : 'empty'}`}
      >
        {star <= normalizedRating ? '★' : '☆'}
      </span>
    ));
  };

  const getPerformanceColor = (percentage) => {
    const normalizedPercentage = percentage || 0;
    if (normalizedPercentage >= 85) return 'high';
    if (normalizedPercentage >= 70) return 'medium';
    return 'low';
  };

  const calculateProgramStats = () => {
    const totalStudents = students.length;
    const totalCourses = courses.length;
    const totalFaculty = faculty.length;
    
    const avgCourseRating = courses.length > 0 
      ? courses.reduce((sum, course) => sum + (course.avgRating || 0), 0) / courses.length 
      : 0;
    
    const avgFacultyRating = faculty.length > 0 
      ? faculty.reduce((sum, facultyMember) => sum + (facultyMember.avgRating || 0), 0) / faculty.length 
      : 0;
    
    return {
      totalStudents,
      totalCourses,
      totalFaculty,
      avgCourseRating: avgCourseRating || 0,
      avgFacultyRating: avgFacultyRating || 0,
      graduationRate: 87,
      employmentRate: 92
    };
  };

  const programStats = calculateProgramStats();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading program data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You must be logged in as a program leader to access this page.</p>
      </div>
    );
  }

  return (
    <div className="program-report-container">
      <div className="breadcrumb">
        <span className="breadcrumb-current">Program Leadership Dashboard</span>
      </div>

      <div className="report-content">
        <header className="report-header">
          <div className="header-text">
            <h1>Program Performance Dashboard</h1>
            <p>Computer Science Program - Academic Year 2024</p>
            <div className="report-meta">
              <span>Program Leader: {currentUser?.name || 'Unknown'}</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div className="header-controls">
            <div className="filter-group">
              <label className="filter-label">Reporting Period</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-select"
              >
                <option value="current_semester">Current Semester</option>
                <option value="last_semester">Last Semester</option>
                <option value="academic_year">Academic Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <button 
              onClick={() => {
                if (currentUser) {
                  fetchUserCourses(currentUser.id);
                  fetchProgramStudents(currentUser.id);
                  fetchProgramFaculty(currentUser.id);
                }
              }}
              className="btn btn-secondary"
            >
              Refresh Data
            </button>
          </div>
        </header>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="navigation-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Program Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Course Management
          </button>
          <button 
            className={`tab-button ${activeTab === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveTab('faculty')}
          >
            Faculty Performance
          </button>
          <button 
            className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Student Analytics
          </button>
          <button 
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Report Generation
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="program-overview">
              <h2>Program Overview</h2>
              <div className="stats-grid">
                <div className="stat-card featured">
                  <div className="stat-icon students">ST</div>
                  <div className="stat-content">
                    <div className="stat-value">{programStats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                    <div className="stat-trend positive">
                      ▲ 12% enrollment growth
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon courses">CR</div>
                  <div className="stat-content">
                    <div className="stat-value">{programStats.totalCourses}</div>
                    <div className="stat-label">Active Courses</div>
                    <div className="stat-trend positive">
                      ▲ 3 new courses
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon faculty">FC</div>
                  <div className="stat-content">
                    <div className="stat-value">{programStats.totalFaculty}</div>
                    <div className="stat-label">Faculty Members</div>
                    <div className="stat-trend stable">
                      ● Full staffing
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon rating">RT</div>
                  <div className="stat-content">
                    <div className="stat-value">{programStats.avgCourseRating.toFixed(1)}/5</div>
                    <div className="stat-label">Avg Course Rating</div>
                    <div className="rating-stars mini">
                      {renderStars(programStats.avgCourseRating)}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon graduation">GR</div>
                  <div className="stat-content">
                    <div className="stat-value">{programStats.graduationRate}%</div>
                    <div className="stat-label">Graduation Rate</div>
                    <div className="stat-trend positive">
                      ▲ 5% improvement
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon employment">EM</div>
                  <div className="stat-content">
                    <div className="stat-value">{programStats.employmentRate}%</div>
                    <div className="stat-label">Employment Rate</div>
                    <div className="stat-trend positive">
                      ▲ 3% growth
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-section">
                <div className="section-header">
                  <h3>Course Performance Analysis</h3>
                  <button 
                    className="section-toggle"
                    onClick={() => toggleSection('courses')}
                  >
                    {expandedSections.courses ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {expandedSections.courses && (
                  <div className="performance-list">
                    {courses.map((course, index) => (
                      <div key={course.id || index} className="performance-card">
                        <div className="performance-header">
                          <div className="performance-rank">{index + 1}</div>
                          <div className="performance-info">
                            <div className="performance-title">{course.name || 'Unnamed Course'}</div>
                            <div className="performance-subtitle">
                              {course.code || 'N/A'} • {course.credits || 0} credits • {course.enrollment || 0} students
                            </div>
                          </div>
                          <div className="performance-metrics">
                            <div className="metric">
                              <span className="metric-label">Completion</span>
                              <span className="metric-value">{course.completionRate || 85}%</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Satisfaction</span>
                              <div className="rating-stars mini">
                                {renderStars(course.avgRating || 4.2)}
                              </div>
                            </div>
                          </div>
                          <div className="performance-rating">
                            <div className="rating-value">{(course.avgRating || 4.2).toFixed(1)}/5</div>
                            <div className="rating-label">Overall Rating</div>
                          </div>
                        </div>
                        <div className="progress-container">
                          <div className="progress-labels">
                            <span>Course Performance</span>
                            <span>{course.performance || 82}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className={`progress-fill ${getPerformanceColor(course.performance || 82)}`}
                              style={{ width: `${course.performance || 82}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="analytics-section">
                <div className="section-header">
                  <h3>Faculty Performance Overview</h3>
                  <button 
                    className="section-toggle"
                    onClick={() => toggleSection('faculty')}
                  >
                    {expandedSections.faculty ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {expandedSections.faculty && (
                  <div className="performance-list">
                    {faculty.map((facultyMember, index) => (
                      <div key={facultyMember.id || index} className="performance-card">
                        <div className="performance-header">
                          <div className="performance-rank">{index + 1}</div>
                          <div className="performance-info">
                            <div className="performance-title">{facultyMember.name || 'Unknown Faculty'}</div>
                            <div className="performance-subtitle">
                              {facultyMember.department || 'N/A'} • {facultyMember.courses || 0} courses
                            </div>
                          </div>
                          <div className="performance-metrics">
                            <div className="metric">
                              <span className="metric-label">Students</span>
                              <span className="metric-value">{facultyMember.students || 0}</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Sessions</span>
                              <span className="metric-value">{facultyMember.sessions || 0}</span>
                            </div>
                          </div>
                          <div className="performance-rating">
                            <div className="rating-stars">
                              {renderStars(facultyMember.avgRating || 4.5)}
                            </div>
                            <div className="rating-value">{(facultyMember.avgRating || 4.5).toFixed(1)}/5</div>
                          </div>
                        </div>
                        <div className="progress-container">
                          <div className="progress-labels">
                            <span>Teaching Performance</span>
                            <span>{((facultyMember.avgRating || 4.5) * 20).toFixed(0)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className={`progress-fill ${getPerformanceColor((facultyMember.avgRating || 4.5) * 20)}`}
                              style={{ width: `${(facultyMember.avgRating || 4.5) * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <div className="report-actions">
            <h3>Generate Program Reports</h3>
            <div className="action-grid">
              <button 
                onClick={() => handleGenerateReport('academic')}
                disabled={generating}
                className="report-action-card"
              >
                <div className="action-icon academic">AP</div>
                <div className="action-content">
                  <h4>Academic Performance Report</h4>
                  <p>Detailed analysis of student performance, academic outcomes, and learning metrics</p>
                  <div className="action-meta">
                    <span>Includes: Grade distributions, Learning outcomes, Performance analytics</span>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => handleGenerateReport('enrollment')}
                disabled={generating}
                className="report-action-card"
              >
                <div className="action-icon enrollment">EN</div>
                <div className="action-content">
                  <h4>Enrollment Analytics Report</h4>
                  <p>Comprehensive enrollment trends, demographic analysis, and retention metrics</p>
                  <div className="action-meta">
                    <span>Includes: Enrollment trends, Demographic data, Retention rates</span>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => handleGenerateReport('faculty')}
                disabled={generating}
                className="report-action-card"
              >
                <div className="action-icon faculty">FP</div>
                <div className="action-content">
                  <h4>Faculty Performance Report</h4>
                  <p>Evaluation of teaching staff performance, course effectiveness, and student feedback</p>
                  <div className="action-meta">
                    <span>Includes: Teaching evaluations, Course ratings, Student feedback analysis</span>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => handleGenerateReport('comprehensive')}
                disabled={generating}
                className="report-action-card primary"
              >
                <div className="action-icon comprehensive">CR</div>
                <div className="action-content">
                  <h4>Comprehensive Program Report</h4>
                  <p>Complete program overview with strategic insights and development recommendations</p>
                  <div className="action-meta">
                    <span>Includes: All program metrics, Strategic analysis, Development recommendations</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div className="generating-overlay">
            <div className="generating-content">
              <div className="generating-spinner"></div>
              <h3>Generating Program Report</h3>
              <p>Compiling program data and generating comprehensive analysis...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramLeaderReport;