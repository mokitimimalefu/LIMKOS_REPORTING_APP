import React, { useState, useEffect, useCallback } from "react";
import { 
  fetchLectures, 
  updateLecture, 
  deleteLecture, 
  exportToCSV,
  getLecturesByLecturer
} from "../api";

export default function Monitoring({ user, onBack }) {
  const [lectures, setLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingLecture, setEditingLecture] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [viewMode, setViewMode] = useState('cards');
  const [analytics, setAnalytics] = useState({
    totalLectures: 0,
    averageAttendance: 0,
    totalStudents: 0,
    topCourses: []
  });

  // Load lectures based on user role
  const loadLectures = useCallback(async () => {
    try {
      setLoading(true);
      let data = [];

      switch (user.role) {
        case 'lecturer':
          // Lecturers can only see their own lectures
          data = await getLecturesByLecturer(user.id);
          break;
        
        case 'program_leader':
          // Program leaders see all lectures (same as principal lecturer)
          data = await fetchLectures();
          break;

        case 'principal_lecturer':
        case 'admin':
          // Principal lecturers and admins see all lectures
          data = await fetchLectures();
          break;
        
        case 'student':
          // Students see all lectures
          data = await fetchLectures();
          break;
        
        default:
          data = [];
      }

      setLectures(data);
    } catch (error) {
      console.error("Error loading lectures:", error);
      setLectures([]);
    } finally {
      setLoading(false);
    }
  }, [user.role, user.id]);

  // Memoized analytics calculation
  const calculateAnalytics = useCallback(() => {
    if (lectures.length === 0) {
      setAnalytics({
        totalLectures: 0,
        averageAttendance: 0,
        totalStudents: 0,
        topCourses: []
      });
      return;
    }

    const totalLectures = lectures.length;
    
    const averageAttendance = lectures.reduce((sum, lecture) => {
      if (lecture.total_registered_students > 0) {
        return sum + ((lecture.actual_students_present || 0) / lecture.total_registered_students);
      }
      return sum;
    }, 0) / totalLectures * 100;

    const totalStudents = lectures.reduce((sum, lecture) => sum + (lecture.actual_students_present || 0), 0);

    // Calculate top courses by attendance
    const courseStats = {};
    lectures.forEach(lecture => {
      if (!courseStats[lecture.course_name]) {
        courseStats[lecture.course_name] = {
          total: 0,
          present: 0,
          count: 0
        };
      }
      courseStats[lecture.course_name].total += (lecture.total_registered_students || 0);
      courseStats[lecture.course_name].present += (lecture.actual_students_present || 0);
      courseStats[lecture.course_name].count++;
    });

    const topCourses = Object.entries(courseStats)
      .map(([name, stats]) => ({
        name,
        attendance: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
        lectures: stats.count
      }))
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 3);

    setAnalytics({
      totalLectures,
      averageAttendance,
      totalStudents,
      topCourses
    });
  }, [lectures]);

  // Memoized filter function
  const filterLectures = useCallback(() => {
    let filtered = lectures;

    if (searchTerm) {
      filtered = filtered.filter(lecture =>
        lecture.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecture.lecturer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecture.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecture.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass) {
      filtered = filtered.filter(lecture => 
        lecture.class_name?.toLowerCase().includes(filterClass.toLowerCase())
      );
    }

    if (filterDate) {
      filtered = filtered.filter(lecture => lecture.date_of_lecture === filterDate);
    }

    if (filterFaculty) {
      filtered = filtered.filter(lecture => 
        lecture.faculty_name?.toLowerCase().includes(filterFaculty.toLowerCase())
      );
    }

    if (filterCourse) {
      filtered = filtered.filter(lecture => 
        lecture.course_id === parseInt(filterCourse) || 
        lecture.course_name?.toLowerCase().includes(filterCourse.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(lecture => {
        const totalStudents = lecture.total_registered_students || 1;
        const attendanceRate = ((lecture.actual_students_present || 0) / totalStudents) * 100;
        switch (filterStatus) {
          case "high": return attendanceRate >= 80;
          case "medium": return attendanceRate >= 60 && attendanceRate < 80;
          case "low": return attendanceRate < 60;
          default: return true;
        }
      });
    }

    setFilteredLectures(filtered);
  }, [lectures, searchTerm, filterClass, filterDate, filterFaculty, filterCourse, filterStatus]);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  useEffect(() => {
    calculateAnalytics();
    filterLectures();
  }, [calculateAnalytics, filterLectures]);

  const handleUpdateLecture = async (updatedLecture) => {
    try {
      // Only allow lecturers to update their own lectures
      if (user.role === 'lecturer' && updatedLecture.lecturer_id !== user.id) {
        alert('You can only update your own lectures');
        return;
      }

      await updateLecture(updatedLecture.id, updatedLecture);
      setLectures(lectures.map(lecture => 
        lecture.id === updatedLecture.id ? updatedLecture : lecture
      ));
      setEditingLecture(null);
    } catch (error) {
      console.error("Error updating lecture:", error);
      alert('Error updating lecture: ' + error.message);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    const lectureToDelete = lectures.find(l => l.id === lectureId);
    
    // Check permissions
    if (user.role === 'lecturer' && lectureToDelete.lecturer_id !== user.id) {
      alert('You can only delete your own lectures');
      return;
    }

    if (window.confirm("Are you sure you want to delete this lecture record?")) {
      try {
        await deleteLecture(lectureId);
        setLectures(lectures.filter(lecture => lecture.id !== lectureId));
      } catch (error) {
        console.error("Error deleting lecture:", error);
        alert('Error deleting lecture: ' + error.message);
      }
    }
  };

  const handleExport = () => {
    exportToCSV(filteredLectures, `lectures_${user.role}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedLectures = React.useMemo(() => {
    if (!sortConfig.key) return filteredLectures;

    return [...filteredLectures].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredLectures, sortConfig]);

  const faculties = [...new Set(lectures.map(lecture => lecture.faculty_name))].filter(Boolean);
  const availableClasses = [...new Set(lectures.map(lecture => lecture.class_name))].filter(Boolean);
  const allCourses = [...new Set(lectures.map(lecture => ({ 
    id: lecture.course_id, 
    course_name: lecture.course_name, 
    course_code: lecture.course_code 
  })))].filter((course, index, self) => 
    index === self.findIndex(c => c.id === course.id)
  );

  // Get role-specific title and description
  const getRoleSpecificContent = () => {
    switch (user.role) {
      case 'lecturer':
        return {
          title: "My Lecture Reports",
          subtitle: "Manage and monitor your lecture sessions and reports",
          canEdit: true,
          canDelete: true
        };
      case 'program_leader':
        return {
          title: "Institution Lecture Monitoring",
          subtitle: "Comprehensive overview of all lecture sessions across the institution",
          canEdit: true,
          canDelete: true
        };
      case 'principal_lecturer':
        return {
          title: "Institution Lecture Monitoring",
          subtitle: "Comprehensive overview of all lecture sessions across the institution",
          canEdit: false,
          canDelete: false
        };
      case 'admin':
        return {
          title: "Lecture Monitoring System",
          subtitle: "Administrative overview and management of all lecture sessions",
          canEdit: true,
          canDelete: true
        };
      case 'student':
        return {
          title: "Lecture Overview",
          subtitle: "View all available lecture sessions and reports",
          canEdit: false,
          canDelete: false
        };
      default:
        return {
          title: "Lecture Monitoring",
          subtitle: "View lecture sessions",
          canEdit: false,
          canDelete: false
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading lecture data...</p>
      </div>
    );
  }

  return (
    <div className="monitoring-container" style={{ color: 'white' }}>
      {/* Header Section */}
      <div className="monitoring-header">
        <div className="header-content">
          <div className="header-main">
            {onBack && (
              <button className="back-btn" onClick={onBack}>
                <span className="back-arrow">←</span>
                Back to Dashboard
              </button>
            )}
            <div className="header-text">
              <h1 className="page-title" style={{ color: 'white' }}>{roleContent.title}</h1>
              <p className="page-subtitle" style={{ color: 'white' }}>{roleContent.subtitle}</p>
              <div className="role-badge" style={{ color: 'white' }}>
                Viewing as: <span className="role-name" style={{ color: 'white' }}>{user.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {user.role !== 'student' && (
              <button className="btn btn-outline" onClick={handleExport}>
                Export to CSV
              </button>
            )}
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </button>
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard - Hide for students or show limited info */}
      {(user.role !== 'student') && (
        <div className="analytics-dashboard" style={{ color: 'white' }}>
          <div className="analytics-header">
            <h3 style={{ color: 'white' }}>Performance Analytics</h3>
            <button className="btn btn-sm btn-outline" onClick={loadLectures}>
              Refresh Data
            </button>
          </div>
          <div className="stats-grid">
            <div className="stat-card featured">
              <div className="stat-content">
                <h3 className="stat-value" style={{ color: 'white' }}>{analytics.totalLectures}</h3>
                <p className="stat-label" style={{ color: 'white' }}>Total Lectures</p>
                <div className="stat-description" style={{ color: 'white' }}>
                  {user.role === 'lecturer' ? 'Your lectures' :
                   'Across institution'}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-value" style={{ color: 'white' }}>{analytics.averageAttendance.toFixed(1)}%</h3>
                <p className="stat-label" style={{ color: 'white' }}>Average Attendance</p>
                <div className="progress-bar mini">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min(analytics.averageAttendance, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-value" style={{ color: 'white' }}>{analytics.totalStudents}</h3>
                <p className="stat-label" style={{ color: 'white' }}>Total Students Attended</p>
                <div className="stat-change positive" style={{ color: 'white' }}>
                  {analytics.totalLectures > 0 ? 'Active' : 'No data'}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3 className="stat-value" style={{ color: 'white' }}>
                  {analytics.topCourses[0]?.attendance.toFixed(1) || 0}%
                </h3>
                <p className="stat-label" style={{ color: 'white' }}>Top Course Attendance</p>
                <div className="top-course" style={{ color: 'white' }}>
                  {analytics.topCourses[0]?.name || 'No data'}
                </div>
              </div>
            </div>
          </div>

          {/* Top Courses */}
          {analytics.topCourses.length > 0 && (
            <div className="top-courses-section">
              <h4 style={{ color: 'white' }}>Top Performing Courses</h4>
              <div className="courses-list">
                {analytics.topCourses.map((course, index) => (
                  <div key={course.name} className="course-item">
                    <div className="course-rank" style={{ color: 'white' }}>#{index + 1}</div>
                    <div className="course-info">
                      <div className="course-name" style={{ color: 'white' }}>{course.name}</div>
                      <div className="course-stats" style={{ color: 'white' }}>
                        {course.lectures} lectures • {course.attendance.toFixed(1)}% attendance
                      </div>
                    </div>
                    <div className="attendance-badge" style={{ color: 'white' }}>
                      {course.attendance.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section" style={{ color: 'white' }}>
        <div className="filters-header">
          <h4 style={{ color: 'white' }}>Filter Lectures</h4>
          <div className="results-count" style={{ color: 'white' }}>
            {filteredLectures.length} of {lectures.length} lectures
          </div>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label" style={{ color: 'white' }}>Search</label>
            <input
              type="text"
              placeholder="Search courses, lecturers, classes, or codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ color: 'black' }}
            />
          </div>
          
          {(user.role === 'principal_lecturer' || user.role === 'admin' || user.role === 'program_leader') && (
            <div className="filter-group">
              <label className="filter-label" style={{ color: 'white' }}>Faculty</label>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="form-input"
                style={{ color: 'black' }}
              >
                <option value="">All Faculties</option>
                {faculties.map(faculty => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
            </div>
          )}

          {(user.role === 'program_leader' || user.role === 'principal_lecturer' || user.role === 'admin') && (
            <div className="filter-group">
              <label className="filter-label" style={{ color: 'white' }}>Course</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="form-input"
                style={{ color: 'black' }}
              >
                <option value="">All Courses</option>
                {allCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_name} ({course.course_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label className="filter-label" style={{ color: 'white' }}>Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="form-input"
              style={{ color: 'black' }}
            >
              <option value="">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" style={{ color: 'white' }}>Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-input"
              style={{ color: 'black' }}
            />
          </div>

          {(user.role !== 'student') && (
            <div className="filter-group">
              <label className="filter-label" style={{ color: 'white' }}>Attendance Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
                style={{ color: 'black' }}
              >
                <option value="all">All Status</option>
                <option value="high">High (≥80%)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
            </div>
          )}
        </div>
        <div className="filter-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm("");
              setFilterClass("");
              setFilterDate("");
              setFilterFaculty("");
              setFilterCourse("");
              setFilterStatus("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Lectures Display */}
      {viewMode === 'cards' ? (
        <div className="lectures-grid">
          {sortedLectures.map(lecture => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onEdit={roleContent.canEdit ? setEditingLecture : null}
              onDelete={roleContent.canDelete ? handleDeleteLecture : null}
              user={user}
              canEdit={roleContent.canEdit && (user.role === 'admin' || lecture.lecturer_id === user.id)}
            />
          ))}
        </div>
      ) : (
        <LecturesTable 
          lectures={sortedLectures}
          onSort={handleSort}
          sortConfig={sortConfig}
          onEdit={roleContent.canEdit ? setEditingLecture : null}
          onDelete={roleContent.canDelete ? handleDeleteLecture : null}
          user={user}
          canEdit={roleContent.canEdit}
        />
      )}

      {sortedLectures.length === 0 && !loading && (
        <div className="empty-state" style={{ color: 'white' }}>
          <h3 style={{ color: 'white' }}>No lectures found</h3>
          <p style={{ color: 'white' }}>
            {user.role === 'lecturer' ? "You haven't created any lecture reports yet." :
             user.role === 'program_leader' ? "No lectures found in the system." :
             user.role === 'student' ? "No lectures available to view at this time." :
             "No lectures match your current filters."}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm("");
              setFilterClass("");
              setFilterDate("");
              setFilterFaculty("");
              setFilterCourse("");
              setFilterStatus("all");
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingLecture && (
        <EditLectureModal
          lecture={editingLecture}
          onSave={handleUpdateLecture}
          onClose={() => setEditingLecture(null)}
          user={user}
        />
      )}
    </div>
  );
}

// Lecture Card Component
function LectureCard({ lecture, onEdit, onDelete, user, canEdit }) {
  const totalStudents = lecture.total_registered_students || 1;
  const attendanceRate = totalStudents > 0 ? 
    (((lecture.actual_students_present || 0) / totalStudents) * 100).toFixed(1) : 0;
  
  const getAttendanceStatus = (rate) => {
    if (rate >= 80) return 'high';
    if (rate >= 60) return 'medium';
    return 'low';
  };

  const status = getAttendanceStatus(attendanceRate);

  return (
    <div className="lecture-card" style={{ color: 'white' }}>
      <div className="lecture-header">
        <div className="course-info">
          <h3 className="course-name" style={{color: 'white'}}>{lecture.course_name}</h3>
          <span className="course-code" style={{color: 'white'}}>{lecture.course_code}</span>
        </div>
        {user.role !== 'student' && (
          <div className={`attendance-indicator ${status}`} style={{ color: 'white' }}>
            {attendanceRate}%
          </div>
        )}
      </div>
      
      <div className="lecture-meta">
        <div className="meta-item">
          <span className="meta-label" style={{ color: 'white' }}>Lecturer:</span>
          <span className="meta-text" style={{ color: 'white' }}>{lecture.lecturer_name}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label" style={{ color: 'white' }}>Class:</span>
          <span className="meta-text" style={{ color: 'white' }}>{lecture.class_name}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label" style={{ color: 'white' }}>Date:</span>
          <span className="meta-text" style={{ color: 'white' }}>{lecture.date_of_lecture}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label" style={{ color: 'white' }}>Time:</span>
          <span className="meta-text" style={{ color: 'white' }}>{lecture.scheduled_time}</span>
        </div>
        {lecture.faculty_name && (
          <div className="meta-item">
            <span className="meta-label" style={{ color: 'white' }}>Faculty:</span>
            <span className="meta-text" style={{ color: 'white' }}>{lecture.faculty_name}</span>
          </div>
        )}
      </div>

      {user.role !== 'student' && (
        <div className="attendance-section" style={{ color: 'white' }}>
          <div className="attendance-visual">
            <div className="attendance-numbers">
              <span className="attendance-count" style={{ color: 'white' }}>
                {lecture.actual_students_present || 0} / {totalStudents}
              </span>
              <span className="attendance-label" style={{ color: 'white' }}>Students Present</span>
            </div>
            <div className="attendance-progress">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${status}`}
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
              <span className="attendance-percentage" style={{ color: 'white' }}>{attendanceRate}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="lecture-content" style={{ color: 'white' }}>
        <div className="content-section">
          <h4 style={{ color: 'white' }}>Topic Covered</h4>
          <p style={{ color: 'white' }}>{lecture.topic_taught || 'No topic specified'}</p>
        </div>
        <div className="content-section">
          <h4 style={{ color: 'white' }}>Learning Outcomes</h4>
          <p style={{ color: 'white' }}>{lecture.learning_outcomes || 'No learning outcomes specified'}</p>
        </div>
        {lecture.recommendations && (
          <div className="content-section">
            <h4 style={{ color: 'white' }}>Recommendations</h4>
            <p style={{ color: 'white' }}>{lecture.recommendations}</p>
          </div>
        )}
      </div>

      {/* Actions Section - Always show View Details, conditionally show Edit and Delete */}
      <div className="lecture-actions" style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn-sm btn-primary">
          View Details
        </button>
        {user.role !== 'student' && (
          <>
            {canEdit && onEdit && (
              <button className="btn btn-sm btn-outline" onClick={() => onEdit(lecture)}>
                Edit
              </button>
            )}
            {onDelete && (user.role === 'admin' || lecture.lecturer_id === user.id) && (
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(lecture.id)}>
                Delete
              </button>
            )}
          </>
        )}
      </div>

      <div className="lecture-footer">
        <div className="footer-meta">
          <span className="meta-text" style={{ color: 'white' }}>
            Reported on {new Date(lecture.created_at).toLocaleDateString()}
          </span>
          {lecture.venue && (
            <span className="meta-text" style={{ color: 'white' }}>Venue: {lecture.venue}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Lectures Table Component
function LecturesTable({ lectures, onSort, sortConfig, onEdit, onDelete, user, canEdit }) {
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }
    return '↕';
  };

  return (
    <div className="table-container" style={{ color: 'white' }}>
      <table className="lectures-table" style={{ color: 'white' }}>
        <thead>
          <tr>
            <th onClick={() => onSort('course_name')} className="sortable" style={{ color: 'white' }}>
              Course {getSortIndicator('course_name')}
            </th>
            <th onClick={() => onSort('lecturer_name')} className="sortable" style={{ color: 'white' }}>
              Lecturer {getSortIndicator('lecturer_name')}
            </th>
            <th onClick={() => onSort('class_name')} className="sortable" style={{ color: 'white' }}>
              Class {getSortIndicator('class_name')}
            </th>
            <th onClick={() => onSort('date_of_lecture')} className="sortable" style={{ color: 'white' }}>
              Date {getSortIndicator('date_of_lecture')}
            </th>
            {user.role !== 'student' && (
              <th onClick={() => onSort('actual_students_present')} className="sortable" style={{ color: 'white' }}>
                Attendance {getSortIndicator('actual_students_present')}
              </th>
            )}
            <th style={{ color: 'white' }}>Topic</th>
            <th style={{ color: 'white' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lectures.map(lecture => {
            const totalStudents = lecture.total_registered_students || 1;
            const attendanceRate = totalStudents > 0 ? 
              (((lecture.actual_students_present || 0) / totalStudents) * 100).toFixed(1) : 0;
            const status = attendanceRate >= 80 ? 'high' : attendanceRate >= 60 ? 'medium' : 'low';
            
            return (
              <tr key={lecture.id} style={{ color: 'white' }}>
                <td style={{ color: 'white' }}>
                  <div className="course-info">
                    <strong style={{ color: 'white' }}>{lecture.course_name}</strong>
                    <span className="course-code" style={{ color: 'white' }}>{lecture.course_code}</span>
                  </div>
                </td>
                <td style={{ color: 'white' }}>{lecture.lecturer_name}</td>
                <td style={{ color: 'white' }}>{lecture.class_name}</td>
                <td style={{ color: 'white' }}>
                  {lecture.date_of_lecture}
                  <div className="text-muted" style={{ color: 'white' }}>{lecture.scheduled_time}</div>
                </td>
                {user.role !== 'student' && (
                  <td style={{ color: 'white' }}>
                    <div className="attendance-cell">
                      <span className="attendance-percent" style={{ color: 'white' }}>{attendanceRate}%</span>
                      <div className="attendance-bar">
                        <div 
                          className={`attendance-fill ${status}`}
                          style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="attendance-count" style={{ color: 'white' }}>
                        {lecture.actual_students_present || 0}/{totalStudents}
                      </span>
                    </div>
                  </td>
                )}
                <td className="topic-cell" style={{ color: 'white' }}>
                  <div className="topic-text" style={{ color: 'white' }}>{lecture.topic_taught || 'No topic specified'}</div>
                </td>
                <td style={{ color: 'white' }}>
                  <div className="table-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-sm btn-primary">
                      View Details
                    </button>
                    {user.role !== 'student' && (
                      <>
                        {canEdit && onEdit && (user.role === 'admin' || lecture.lecturer_id === user.id) && (
                          <button className="btn btn-sm btn-outline" onClick={() => onEdit(lecture)}>
                            Edit
                          </button>
                        )}
                        {onDelete && (user.role === 'admin' || lecture.lecturer_id === user.id) && (
                          <button className="btn btn-sm btn-danger" onClick={() => onDelete(lecture.id)}>
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Edit Lecture Modal Component
function EditLectureModal({ lecture, onSave, onClose, user }) {
  const [formData, setFormData] = useState(lecture);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ color: 'white' }}>
        <div className="modal-header">
          <h2 style={{ color: 'white' }}>Edit Lecture Report</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ color: 'white' }}>Students Present</label>
              <input
                type="number"
                value={formData.actual_students_present || 0}
                onChange={(e) => handleChange('actual_students_present', parseInt(e.target.value) || 0)}
                className="form-input"
                style={{ color: 'black' }}
                min="0"
                max={formData.total_registered_students || 100}
              />
              <div className="input-helper" style={{ color: 'white' }}>
                Total registered: {formData.total_registered_students || 0} students
              </div>
            </div>
            <div className="form-group">
              <label style={{ color: 'white' }}>Total Registered</label>
              <input
                type="number"
                value={formData.total_registered_students || 0}
                onChange={(e) => handleChange('total_registered_students', parseInt(e.target.value) || 0)}
                className="form-input"
                style={{ color: 'black' }}
                min="0"
              />
            </div>
            <div className="form-group full-width">
              <label style={{ color: 'white' }}>Topic Taught</label>
              <input
                type="text"
                value={formData.topic_taught || ''}
                onChange={(e) => handleChange('topic_taught', e.target.value)}
                className="form-input"
                style={{ color: 'black' }}
                placeholder="Enter the topic covered in this lecture"
              />
            </div>
            <div className="form-group full-width">
              <label style={{ color: 'white' }}>Learning Outcomes</label>
              <textarea
                value={formData.learning_outcomes || ''}
                onChange={(e) => handleChange('learning_outcomes', e.target.value)}
                className="form-input"
                style={{ color: 'black' }}
                rows="3"
                placeholder="Describe the learning outcomes achieved"
              />
            </div>
            <div className="form-group full-width">
              <label style={{ color: 'white' }}>Recommendations</label>
              <textarea
                value={formData.recommendations || ''}
                onChange={(e) => handleChange('recommendations', e.target.value)}
                className="form-input"
                style={{ color: 'black' }}
                rows="3"
                placeholder="Any recommendations for future sessions"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}