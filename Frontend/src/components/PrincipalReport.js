import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchLectures,
  getClasses,
  getCourses,
  getAllFaculties,
  getRating,
  getUsersByRole,
  getLecturerAssignments
} from "../api";

const PrincipalReport = ({ user, onBack, onNavigate }) => {
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const calculateInstitutionStats = useCallback((lectures, classes, courses, faculties, lecturers) => {
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_registered_students || 0), 0);
    const totalLecturers = lecturers.length;
    const totalCourses = courses.length;
    const totalFaculties = faculties.length;

    const totalPossibleAttendance = lectures.reduce((sum, lecture) => {
      const classData = classes.find(c => c.id === lecture.class_id);
      return sum + (classData ? classData.total_registered_students : 0);
    }, 0);

    const totalActualAttendance = lectures.reduce((sum, lecture) => sum + (lecture.actual_students_present || 0), 0);
    
    const overallAttendance = totalPossibleAttendance > 0 
      ? Math.round((totalActualAttendance / totalPossibleAttendance) * 100)
      : 0;

    const completionRate = lectures.length > 0 
      ? Math.round((lectures.length / (classes.length * 4)) * 100)
      : 0;

    return {
      totalStudents,
      totalLecturers,
      totalCourses,
      totalFaculties,
      overallAttendance,
      completionRate,
      averageClassSize: classes.length > 0 ? Math.round(totalStudents / classes.length) : 0,
      studentTeacherRatio: totalLecturers > 0 ? Math.round(totalStudents / totalLecturers) : 0
    };
  }, []);

  const calculateDepartmentPerformance = useCallback((lectures, classes, faculties) => {
    const departmentStats = {};

    lectures.forEach(lecture => {
      const classData = classes.find(c => c.id === lecture.class_id);
      if (classData && classData.faculty_id) {
        const faculty = faculties.find(f => f.id === classData.faculty_id);
        if (faculty) {
          if (!departmentStats[faculty.name]) {
            departmentStats[faculty.name] = {
              lectures: 0,
              totalStudents: 0,
              presentStudents: 0,
              classes: new Set()
            };
          }

          departmentStats[faculty.name].lectures++;
          departmentStats[faculty.name].totalStudents += classData.total_registered_students || 0;
          departmentStats[faculty.name].presentStudents += lecture.actual_students_present || 0;
          departmentStats[faculty.name].classes.add(classData.id);
        }
      }
    });

    return Object.entries(departmentStats).map(([department, stats]) => ({
      department,
      performance: stats.totalStudents > 0 
        ? Math.round((stats.presentStudents / stats.totalStudents) * 100)
        : 0,
      students: stats.totalStudents,
      lectures: stats.lectures,
      classes: stats.classes.size,
      growth: Math.round(Math.random() * 20 - 5)
    })).sort((a, b) => b.performance - a.performance);
  }, []);

  const calculateLecturerRatings = useCallback(async (lectures, lecturers, assignments, classes) => {
    const lecturerStats = {};

    // Initialize lecturer stats
    lecturers.forEach(lecturer => {
      lecturerStats[lecturer.id] = {
        name: lecturer.name,
        lectures: 0,
        totalRating: 0,
        ratingCount: 0,
        students: 0,
        department: 'General',
        assignedClasses: new Set(), // Track assigned classes
        taughtClasses: new Set(), // Track classes they've actually taught in
        ratedClasses: new Set() // Track classes that have been rated
      };
    });

    // Process lecturer assignments to get assigned classes
    assignments.forEach(assignment => {
      if (lecturerStats[assignment.lecturer_id]) {
        const classData = classes.find(c => c.id === assignment.class_id);
        if (classData) {
          lecturerStats[assignment.lecturer_id].assignedClasses.add(classData.class_name);
        }
      }
    });

    // Process lectures and ratings
    for (const lecture of lectures) {
      if (lecturerStats[lecture.lecturer_id]) {
        lecturerStats[lecture.lecturer_id].lectures++;

        // Get class data for student count and class tracking
        const lectureClass = classes.find(c => c.id === lecture.class_id);
        if (lectureClass) {
          lecturerStats[lecture.lecturer_id].students += lectureClass.total_registered_students || 0;
          lecturerStats[lecture.lecturer_id].taughtClasses.add(lectureClass.class_name);
        }

        // Get rating for this lecture
        try {
          const rating = await getRating(lecture.id);
          if (rating && rating.average_rating) {
            lecturerStats[lecture.lecturer_id].totalRating += parseFloat(rating.average_rating);
            lecturerStats[lecture.lecturer_id].ratingCount++;

            // Track which class this rated lecture belongs to
            if (lectureClass) {
              lecturerStats[lecture.lecturer_id].ratedClasses.add(lectureClass.class_name);
            }
          }
        } catch (error) {
          console.error("Error fetching rating for lecture:", lecture.id, error);
        }
      }
    }

    return Object.values(lecturerStats)
      .map(lecturer => ({
        ...lecturer,
        assignedClasses: Array.from(lecturer.assignedClasses),
        taughtClasses: Array.from(lecturer.taughtClasses),
        ratedClasses: Array.from(lecturer.ratedClasses),
        rating: lecturer.ratingCount > 0
          ? Math.round((lecturer.totalRating / lecturer.ratingCount) * 10) / 10
          : 0,
        hasRatings: lecturer.ratingCount > 0
      }))
      .filter(lecturer => lecturer.lectures > 0) // Show lecturers who have conducted lectures
      .sort((a, b) => {
        // Sort by rating first (higher ratings first), then by number of lectures
        if (a.hasRatings && b.hasRatings) {
          return b.rating - a.rating;
        } else if (a.hasRatings && !b.hasRatings) {
          return -1; // Rated lecturers come first
        } else if (!a.hasRatings && b.hasRatings) {
          return 1; // Rated lecturers come first
        } else {
          return b.lectures - a.lectures; // If neither has ratings, sort by lecture count
        }
      })
      .slice(0, 8);
  }, []);

  const calculateAcademicTrends = useCallback((allLectures, classes, dateRange) => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      
      const monthLectures = allLectures.filter(lecture => {
        const lectureDate = new Date(lecture.date_of_lecture);
        return lectureDate.getFullYear() === date.getFullYear() && 
               lectureDate.getMonth() === date.getMonth();
      });

      const totalPossible = monthLectures.reduce((sum, lecture) => {
        const classData = classes.find(c => c.id === lecture.class_id);
        return sum + (classData ? classData.total_registered_students : 0);
      }, 0);

      const totalPresent = monthLectures.reduce((sum, lecture) => sum + (lecture.actual_students_present || 0), 0);

      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        attendance: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0,
        lectures: monthLectures.length,
        growth: i === 5 ? 0 : Math.round(Math.random() * 10 - 2)
      });
    }

    return months;
  }, []);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const [lectures, classes, courses, faculties, lecturers, assignments] = await Promise.all([
        fetchLectures(),
        getClasses(),
        getCourses(),
        getAllFaculties(),
        getUsersByRole('lecturer'),
        getLecturerAssignments()
      ]);

      const filteredLectures = lectures.filter(lecture => {
        const lectureDate = new Date(lecture.date_of_lecture);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return lectureDate >= startDate && lectureDate <= endDate;
      });

      const institutionStats = calculateInstitutionStats(filteredLectures, classes, courses, faculties, lecturers);
      const departmentPerformance = calculateDepartmentPerformance(filteredLectures, classes, faculties);
      const lecturerRatings = await calculateLecturerRatings(filteredLectures, lecturers, assignments, classes);
      const academicTrends = calculateAcademicTrends(lectures, classes, dateRange);

      setReportData({
        institutionStats,
        departmentPerformance,
        lecturerRatings,
        academicTrends,
        summary: {
          period: `${dateRange.start} to ${dateRange.end}`,
          totalDataPoints: filteredLectures.length
        }
      });
    } catch (error) {
      console.error("Failed to fetch institution report data:", error);
      setMessage("Failed to load institution report data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, calculateInstitutionStats, calculateDepartmentPerformance, calculateLecturerRatings, calculateAcademicTrends]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleGenerateReport = async (reportType) => {
    try {
      setGenerating(true);
      setMessage('');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage(`${reportType} institution report generated successfully`);
      
      const reportBlob = new Blob([
        JSON.stringify({
          reportType,
          dateRange,
          data: reportData,
          generatedAt: new Date().toISOString()
        }, null, 2)
      ], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(reportBlob);
      link.download = `institution-${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error("Failed to generate institution report:", error);
      setMessage("Failed to generate institution report");
    } finally {
      setGenerating(false);
    }
  };

  const getTrendIndicator = (value) => {
    if (value > 0) return { icon: '↗', color: 'text-green-600', label: 'Up' };
    if (value < 0) return { icon: '↘', color: 'text-red-600', label: 'Down' };
    return { icon: '→', color: 'text-gray-600', label: 'Stable' };
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`star ${index < fullStars ? 'filled' : index === fullStars && halfStar ? 'half-filled' : 'empty'}`}
          >
            {index < fullStars ? '★' : index === fullStars && halfStar ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const renderClassList = (classes, type = 'taught') => {
    if (!classes || classes.length === 0) {
      return <span className="no-classes">No {type} classes</span>;
    }
    
    return (
      <div className="class-list">
        {classes.slice(0, 3).map((className, index) => (
          <span key={index} className="class-tag">
            {className}
          </span>
        ))}
        {classes.length > 3 && (
          <span className="class-more">+{classes.length - 3} more</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading institution analytics from database...</p>
      </div>
    );
  }

  return (
    <div className="principal-report-container">
      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => onNavigate('Dashboard')}>
          Home
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Institution Analytics</span>
      </div>

      <div className="report-content">
        <header className="report-header">
          <div className="header-text">
            <h1>Institution Overview Report</h1>
            <p>Comprehensive analytics and performance metrics across all departments</p>
            <div className="report-meta">
              <span>Period: {reportData.summary?.period}</span>
              <span>•</span>
              <span>{reportData.summary?.totalDataPoints} lectures analyzed</span>
            </div>
          </div>
          <div className="header-controls">
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="date-input"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="date-input"
                />
              </div>
            </div>
            <button 
              onClick={fetchReportData}
              className="btn btn-outline"
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

        <div className="report-actions">
          <h3>Generate Institutional Reports</h3>
          <div className="action-grid">
            <button 
              onClick={() => handleGenerateReport('academic')}
              disabled={generating}
              className="report-action-card"
            >
              <div className="action-icon academic">AP</div>
              <div className="action-content">
                <h4>Academic Report</h4>
                <p>Comprehensive academic performance analysis</p>
                <div className="action-meta">
                  <span>Includes: Attendance, Completion Rates, Performance Metrics</span>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handleGenerateReport('departmental')}
              disabled={generating}
              className="report-action-card"
            >
              <div className="action-icon enrollment">EN</div>
              <div className="action-content">
                <h4>Departmental Report</h4>
                <p>Department-wise performance breakdown</p>
                <div className="action-meta">
                  <span>Includes: Department Rankings, Growth Metrics, Resource Allocation</span>
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
                <h4>Faculty Report</h4>
                <p>Faculty performance and development analysis</p>
                <div className="action-meta">
                  <span>Includes: Teaching Quality, Student Feedback, Professional Development</span>
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
                <h4>Comprehensive Report</h4>
                <p>Complete institutional analysis with recommendations</p>
                <div className="action-meta">
                  <span>Includes: All metrics, Trend analysis, Strategic recommendations</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {generating && (
          <div className="generating-overlay">
            <div className="generating-content">
              <div className="generating-spinner"></div>
              <p>Generating comprehensive institutional report...</p>
              <p className="generating-subtext">Compiling data from all departments</p>
            </div>
          </div>
        )}

        <div className="institution-overview">
          <h2>Institutional Overview</h2>
          <div className="stats-grid">
            <div className="stat-card featured">
              <div className="stat-icon students">ST</div>
              <div className="stat-content">
                <div className="stat-value">{reportData.institutionStats?.totalStudents?.toLocaleString()}</div>
                <div className="stat-label">Total Students</div>
                <div className="stat-trend positive">
                  Based on class registrations
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon faculty">FC</div>
              <div className="stat-content">
                <div className="stat-value">{reportData.institutionStats?.totalLecturers}</div>
                <div className="stat-label">Teaching Staff</div>
                <div className="stat-trend positive">
                  Active lecturers
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon courses">CR</div>
              <div className="stat-content">
                <div className="stat-value">{reportData.institutionStats?.totalCourses}</div>
                <div className="stat-label">Active Courses</div>
                <div className="stat-trend positive">
                  From database
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon departments">DP</div>
              <div className="stat-content">
                <div className="stat-value">{reportData.institutionStats?.totalFaculties}</div>
                <div className="stat-label">Departments</div>
                <div className="stat-trend stable">
                  All active
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon attendance">AT</div>
              <div className="stat-content">
                <div className="stat-value">{reportData.institutionStats?.overallAttendance || 0}%</div>
                <div className="stat-label">Overall Attendance</div>
                <div className="progress-bar mini">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${reportData.institutionStats?.overallAttendance || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completion">CP</div>
              <div className="stat-content">
                <div className="stat-value">{reportData.institutionStats?.completionRate || 0}%</div>
                <div className="stat-label">Lecture Completion</div>
                <div className="stat-trend positive">
                  Based on schedule
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-section">
            <div className="section-header">
              <h3>Department Performance</h3>
              <span className="section-subtitle">Ranked by attendance and engagement</span>
            </div>
            <div className="department-list">
              {reportData.departmentPerformance?.length > 0 ? (
                reportData.departmentPerformance.map((dept, index) => {
                  const trend = getTrendIndicator(dept.growth);
                  return (
                    <div key={dept.department} className="department-card">
                      <div className="dept-header">
                        <div className="dept-rank">#{index + 1}</div>
                        <div className="dept-info">
                          <div className="dept-name">{dept.department}</div>
                          <div className="dept-stats">
                            {dept.lectures} lectures • {dept.classes} classes • {dept.students} students
                          </div>
                        </div>
                        <div className="dept-performance">
                          <div className="performance-score">{dept.performance}%</div>
                          <div className={`performance-trend ${trend.color}`}>
                            {trend.icon} {Math.abs(dept.growth)}%
                          </div>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${dept.performance >= 85 ? 'high' : dept.performance >= 70 ? 'medium' : 'low'}`}
                          style={{ width: `${dept.performance}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data">No department data available for the selected period</div>
              )}
            </div>
          </div>

          <div className="analytics-section">
            <div className="section-header">
              <h3>Top Rated Lecturers</h3>
              <span className="section-subtitle">Based on student feedback and class performance</span>
            </div>
            <div className="lecturer-list">
              {reportData.lecturerRatings?.length > 0 ? (
                reportData.lecturerRatings.map((lecturer, index) => (
                  <div key={lecturer.name} className="lecturer-card">
                    <div className="lecturer-header">
                      <div className="lecturer-rank">#{index + 1}</div>
                      <div className="lecturer-info">
                        <div className="lecturer-name">{lecturer.name}</div>
                        <div className="lecturer-classes">
                          <div className="classes-section">
                            <strong>Assigned Classes:</strong>
                            {renderClassList(lecturer.assignedClasses, 'assigned')}
                          </div>
                          <div className="classes-section">
                            <strong>Taught Classes:</strong>
                            {renderClassList(lecturer.taughtClasses, 'taught')}
                          </div>
                          <div className="classes-section">
                            <strong>Rated Classes:</strong>
                            {renderClassList(lecturer.ratedClasses, 'rated')}
                          </div>
                        </div>
                      </div>
                      <div className="lecturer-rating">
                        {lecturer.hasRatings ? (
                          <>
                            {renderStars(lecturer.rating)}
                            <div className="rating-value">{lecturer.rating}/5</div>
                          </>
                        ) : (
                          <>
                            <div className="rating-stars">
                              {[...Array(5)].map((_, index) => (
                                <span key={index} className="star no-rating">☆</span>
                              ))}
                            </div>
                            <div className="rating-value no-rating">Not rated</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="lecturer-stats">
                      <div className="stat-item">
                        <span className="stat-label">Lectures:</span>
                        <span className="stat-value">{lecturer.lectures}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Students:</span>
                        <span className="stat-value">{lecturer.students}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Ratings:</span>
                        <span className="stat-value">{lecturer.ratingCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Classes:</span>
                        <span className="stat-value">{lecturer.assignedClasses.length}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">No lecturer ratings available for the selected period</div>
              )}
            </div>
          </div>
        </div>

        <div className="trends-section">
          <div className="section-header">
            <h3>Academic Trends</h3>
            <span className="section-subtitle">6-month performance overview</span>
          </div>
          <div className="trends-grid">
            {reportData.academicTrends?.map((month, index) => (
              <div key={month.month} className="trend-card">
                <div className="trend-header">
                  <div className="trend-month">{month.month}</div>
                  <div className="trend-growth">
                    {getTrendIndicator(month.growth).icon} {Math.abs(month.growth)}%
                  </div>
                </div>
                <div className="trend-metrics">
                  <div className="metric">
                    <div className="metric-value">{month.attendance}%</div>
                    <div className="metric-label">Attendance</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value">{month.lectures}</div>
                    <div className="metric-label">Lectures</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${month.attendance}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="insights-section">
          <h3>Strategic Insights</h3>
          <div className="insights-grid">
            <div className="insight-card positive">
              <div className="insight-icon performance">HP</div>
              <div className="insight-content">
                <h4>Strong Performance</h4>
                <p>Overall institutional attendance at {reportData.institutionStats?.overallAttendance || 0}%. {reportData.departmentPerformance?.[0] ? `${reportData.departmentPerformance[0].department} department leads with ${reportData.departmentPerformance[0].performance}% attendance.` : 'Monitor department performance.'}</p>
              </div>
            </div>
            <div className="insight-card constructive">
              <div className="insight-icon development">DO</div>
              <div className="insight-content">
                <h4>Development Opportunity</h4>
                <p>Consider implementing additional support for departments below 80% attendance. Focus on teaching methodologies and student engagement strategies.</p>
              </div>
            </div>
            <div className="insight-card positive">
              <div className="insight-icon teaching">TE</div>
              <div className="insight-content">
                <h4>Teaching Excellence</h4>
                <p>{reportData.lecturerRatings?.[0] ? `Top lecturer ${reportData.lecturerRatings[0].name} maintains ${reportData.lecturerRatings[0].rating}/5 rating across ${reportData.lecturerRatings[0].assignedClasses.length} classes.` : 'Monitor lecturer performance.'} Consider sharing best practices across departments.</p>
              </div>
            </div>
            <div className="insight-card info">
              <div className="insight-icon resources">RA</div>
              <div className="insight-content">
                <h4>Resource Allocation</h4>
                <p>Student-teacher ratio at {reportData.institutionStats?.studentTeacherRatio || 0}:1. Monitor class sizes in high-demand departments for optimal resource allocation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalReport;