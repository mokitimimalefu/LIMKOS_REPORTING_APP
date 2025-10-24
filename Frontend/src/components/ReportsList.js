import React, { useState, useEffect, useCallback } from "react";
import { fetchLectures, exportToCSV } from "../api";

export default function ReportsList({ user }) {
  const [lectures, setLectures] = useState([]);
  const [filteredLectures, setFilteredLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    class: "",
    course: "",
    lecturer: "",
    status: "all"
  });
  const [sortConfig, setSortConfig] = useState({ key: "date_of_lecture", direction: "desc" });

  const loadAllData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const lecturesData = await fetchLectures();

      setLectures(lecturesData);
      setFilteredLectures(lecturesData);

      if (lecturesData.length === 0) setMessage("No lectures found in the system");
    } catch (err) {
      setMessage(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const filterLectures = useCallback(() => {
    let filtered = [...lectures];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(lec =>
        lec.course_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        lec.lecturer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        lec.topic_taught?.toLowerCase().includes(filters.search.toLowerCase()) ||
        lec.class_name?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(lec => lec.date_of_lecture >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(lec => lec.date_of_lecture <= filters.dateTo);
    }

    // Class filter
    if (filters.class) {
      filtered = filtered.filter(lec => lec.class_name === filters.class);
    }

    // Course filter
    if (filters.course) {
      filtered = filtered.filter(lec => lec.course_name === filters.course);
    }

    // Lecturer filter
    if (filters.lecturer) {
      filtered = filtered.filter(lec => lec.lecturer_name === filters.lecturer);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(lec => {
        if (!lec.total_registered_students || lec.total_registered_students === 0) return false;
        const attendanceRate = (lec.actual_students_present / lec.total_registered_students) * 100;
        if (filters.status === "high") return attendanceRate >= 80;
        if (filters.status === "medium") return attendanceRate >= 60 && attendanceRate < 80;
        if (filters.status === "low") return attendanceRate < 60;
        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'date_of_lecture') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredLectures(sorted);
  }, [lectures, filters, sortConfig]);

  useEffect(() => {
    filterLectures();
  }, [filterLectures]);



  const handleExport = () => {
    if (filteredLectures.length === 0) {
      setMessage("No data available to export");
      return;
    }
    exportToCSV(filteredLectures);
    setMessage("Data exported successfully");
  };

  const getUniqueValues = (key) => {
    return [...new Set(lectures.map(lec => lec[key]).filter(Boolean))].sort();
  };

  const getAttendanceStatus = (lecture) => {
    if (!lecture.total_registered_students || lecture.total_registered_students === 0) {
      return { status: "unknown", label: "No Data", color: "text-gray-600" };
    }
    const rate = (lecture.actual_students_present / lecture.total_registered_students) * 100;
    if (rate >= 80) return { status: "high", label: "High", color: "text-green-600" };
    if (rate >= 60) return { status: "medium", label: "Medium", color: "text-yellow-600" };
    return { status: "low", label: "Low", color: "text-red-600" };
  };

  const getAttendanceRate = (lecture) => {
    if (!lecture.total_registered_students || lecture.total_registered_students === 0) return 0;
    return Math.round((lecture.actual_students_present / lecture.total_registered_students) * 100);
  };

  const calculateOverallStats = () => {
    const totalLectures = lectures.length;
    const totalStudents = lectures.reduce((sum, lec) => sum + lec.actual_students_present, 0);
    const totalCapacity = lectures.reduce((sum, lec) => sum + (lec.total_registered_students || 0), 0);
    const avgAttendance = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
    const uniqueLecturers = new Set(lectures.map(lec => lec.lecturer_name)).size;

    return { totalLectures, totalStudents, avgAttendance, uniqueLecturers };
  };

  const stats = calculateOverallStats();

  return (
    <div className="reports-container">
      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => window.history.back()}>
          Home
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Lecture Reports</span>
      </div>

      <div className="quick-navigation">
        <h4>Quick Navigation</h4>
        <div className="nav-buttons">
          <button onClick={() => window.location.reload()}>Dashboard</button>
          <button onClick={loadAllData}>Refresh Data</button>
          <button onClick={handleExport}>Export CSV</button>
        </div>
      </div>

      <div className="reports-content">
        <header className="reports-header">
          <div className="header-text">
            <h1>Lecture Reports</h1>
            <p>Comprehensive analysis and monitoring of all lecture activities</p>
            <div className="header-subtitle">
              Real-time data from university lecture tracking system
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline" 
              onClick={loadAllData} 
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleExport}
              disabled={filteredLectures.length === 0}
            >
              Export CSV
            </button>
          </div>
        </header>

        {message && (
          <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalLectures}</h3>
              <p>Total Lectures</p>
              <div className="stat-trend">
                Across all classes and courses
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.totalStudents.toLocaleString()}</h3>
              <p>Students Attended</p>
              <div className="stat-trend">
                Total participation count
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.avgAttendance}%</h3>
              <p>Average Attendance</p>
              <div className="stat-trend">
                Overall attendance rate
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{stats.uniqueLecturers}</h3>
              <p>Active Lecturers</p>
              <div className="stat-trend">
                Teaching faculty members
              </div>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-header">
            <h3>Filter Reports</h3>
            <div className="filters-actions">
              <span className="results-count">
                {filteredLectures.length} of {lectures.length} lectures
              </span>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setFilters({
                  search: "",
                  dateFrom: "",
                  dateTo: "",
                  class: "",
                  course: "",
                  lecturer: "",
                  status: "all"
                })}
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <input
                type="text"
                placeholder="Search courses, lecturers, topics, classes..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="form-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="date-range-group">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="form-input"
                  placeholder="From date"
                />
                <span className="date-range-separator">to</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="form-input"
                  placeholder="To date"
                />
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Class</label>
              <select
                value={filters.class}
                onChange={(e) => setFilters({...filters, class: e.target.value})}
                className="form-input"
              >
                <option value="">All Classes</option>
                {getUniqueValues("class_name").map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Course</label>
              <select
                value={filters.course}
                onChange={(e) => setFilters({...filters, course: e.target.value})}
                className="form-input"
              >
                <option value="">All Courses</option>
                {getUniqueValues("course_name").map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Lecturer</label>
              <select
                value={filters.lecturer}
                onChange={(e) => setFilters({...filters, lecturer: e.target.value})}
                className="form-input"
              >
                <option value="">All Lecturers</option>
                {getUniqueValues("lecturer_name").map(lecturer => (
                  <option key={lecturer} value={lecturer}>{lecturer}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Attendance Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="high">High (≥80%)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Low (&lt;60%)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sort-section">
          <div className="sort-header">
            <h4>Sorted by: {sortConfig.key.replace('_', ' ')} ({sortConfig.direction})</h4>
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction });
              }}
              className="form-input"
            >
              <option value="date_of_lecture-desc">Date (Newest First)</option>
              <option value="date_of_lecture-asc">Date (Oldest First)</option>
              <option value="course_name-asc">Course (A-Z)</option>
              <option value="course_name-desc">Course (Z-A)</option>
              <option value="actual_students_present-desc">Attendance (High to Low)</option>
              <option value="actual_students_present-asc">Attendance (Low to High)</option>
              <option value="lecturer_name-asc">Lecturer (A-Z)</option>
              <option value="class_name-asc">Class (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="lectures-grid">
          {filteredLectures.map(lec => {
            const attendance = getAttendanceStatus(lec);
            const attendanceRate = getAttendanceRate(lec);
            
            return (
              <div key={lec.id} className="lecture-card">
                <div className="card-header">
                  <div className="course-info">
                    <h3 className="course-name">{lec.course_name}</h3>
                    <span className="course-code">{lec.course_code}</span>
                  </div>
                  <div className={`attendance-badge ${attendance.status}`}>
                    {attendanceRate}%
                  </div>
                </div>
                
                <div className="lecture-meta">
                  <div className="meta-item">
                    <span className="meta-label">Lecturer:</span>
                    <span className="meta-value">{lec.lecturer_name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Class:</span>
                    <span className="meta-value">{lec.class_name}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{lec.date_of_lecture}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Week:</span>
                    <span className="meta-value">{lec.week_of_reporting}</span>
                  </div>
                </div>

                <div className="attendance-section">
                  <div className="attendance-stats">
                    <div className="attendance-numbers">
                      {lec.actual_students_present} / {lec.total_registered_students}
                      <span className="attendance-label">Students Present</span>
                    </div>
                    <div className="attendance-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${attendance.status}`}
                          style={{ width: `${attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className={`attendance-rate ${attendance.status}`}>
                        {attendanceRate}% Attendance Rate
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lecture-content">
                  <div className="content-section">
                    <h4>Topic Covered</h4>
                    <p>{lec.topic_taught || "No topic specified"}</p>
                  </div>
                  
                  <div className="content-section">
                    <h4>Learning Outcomes</h4>
                    <p>{lec.learning_outcomes || "No outcomes specified"}</p>
                  </div>
                  
                  {lec.recommendations && (
                    <div className="content-section">
                      <h4>Recommendations</h4>
                      <p>{lec.recommendations}</p>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="footer-meta">
                    <span className="meta-text">
                      Reported on {new Date(lec.created_at).toLocaleDateString()}
                    </span>
                    <span className="meta-text">
                      Lecture ID: {lec.id}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLectures.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No lectures found</h3>
            <p>Try adjusting your search criteria or clear filters to see all lectures</p>
            <button 
              onClick={() => setFilters({
                search: "",
                dateFrom: "",
                dateTo: "",
                class: "",
                course: "",
                lecturer: "",
                status: "all"
              })}
              className="btn btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading lecture data...</p>
          </div>
        )}
      </div>
    </div>
  );
}