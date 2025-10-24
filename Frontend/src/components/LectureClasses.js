import React, { useState, useEffect } from 'react';
import { getClasses, getAllFaculties, getCurrentUser, getLecturesByLecturer } from "../api";

const LectureClasses = ({ onNavigate }) => {
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [filterFaculty, setFilterFaculty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const isLecturer = currentUser && currentUser.role === 'lecturer';

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const userData = getCurrentUser();
        setCurrentUser(userData);
        
        console.log("Current user:", userData);

        // Fetch faculties and classes in parallel
        const [facultiesData, classesData] = await Promise.all([
          getAllFaculties(),
          getClasses()
        ]);

        console.log("Fetched faculties:", facultiesData);
        console.log("Fetched classes:", classesData);
        
        setFaculties(facultiesData);

        let processedClasses = classesData;

        if (userData?.role === 'lecturer') {
          // For lecturers, we need to determine which classes they have lectures for
          try {
            const lecturerLectures = await getLecturesByLecturer(userData.id);
            console.log("Lecturer's lectures:", lecturerLectures);
            
            if (lecturerLectures && lecturerLectures.length > 0) {
              // Get unique class IDs from lectures
              const lectureClassIds = [...new Set(lecturerLectures.map(lecture => lecture.class_id))];
              console.log("Class IDs from lectures:", lectureClassIds);
              
              // Filter classes to only show those the lecturer has taught in
              processedClasses = classesData.filter(cls => lectureClassIds.includes(cls.id));
              console.log("Filtered classes for lecturer:", processedClasses);
            } else {
              console.log("No lectures found for lecturer");
              processedClasses = [];
            }
          } catch (error) {
            console.error("Error fetching lecturer lectures:", error);
            // If we can't get lectures, show no classes for lecturer
            processedClasses = [];
          }
        }

        setClasses(processedClasses || []);
        
      } catch (error) {
        console.error("Failed to initialize data:", error);
        setMessage("Failed to load classes: " + (error.message || 'Unknown error'));
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const classesData = await getClasses();
      let processedClasses = classesData;
      
      if (currentUser?.role === 'lecturer') {
        try {
          const lecturerLectures = await getLecturesByLecturer(currentUser.id);
          
          if (lecturerLectures && lecturerLectures.length > 0) {
            const lectureClassIds = [...new Set(lecturerLectures.map(lecture => lecture.class_id))];
            processedClasses = classesData.filter(cls => lectureClassIds.includes(cls.id));
          } else {
            processedClasses = [];
          }
        } catch (error) {
          console.error("Error refreshing lecturer lectures:", error);
          processedClasses = [];
        }
      }

      setClasses(processedClasses || []);
      setMessage('Classes refreshed successfully!');
      
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error("Failed to refresh data:", error);
      setMessage("Failed to refresh classes: " + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getFacultyName = (facultyId) => {
    if (!facultyId) return "No Faculty";
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : "Unknown Faculty";
  };

  const formatTimeDisplay = (time) => {
    if (!time) return "Not scheduled";
    
    const timeStr = typeof time === 'string' ? time : String(time);
    const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
    
    const timeMappings = {
      '09:00:00': '09:00 - 10:30',
      '10:30:00': '10:30 - 12:00', 
      '14:00:00': '14:00 - 15:30',
      '15:30:00': '15:30 - 17:00',
      '09:00': '09:00 - 10:30',
      '10:30': '10:30 - 12:00',
      '14:00': '14:00 - 15:30',
      '15:30': '15:30 - 17:00'
    };
    
    return timeMappings[timePart] || timePart;
  };

  const getWeekdayFromTime = (time) => {
    if (!time) return 'Schedule not set';
    
    const timeStr = typeof time === 'string' ? time : String(time);
    const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
    
    const timeMappings = {
      '09:00:00': 'Mon, Wed, Fri',
      '10:30:00': 'Tue, Thu',
      '14:00:00': 'Mon, Wed',
      '15:30:00': 'Tue, Thu, Fri',
      '09:00': 'Mon, Wed, Fri',
      '10:30': 'Tue, Thu',
      '14:00': 'Mon, Wed',
      '15:30': 'Tue, Thu, Fri'
    };
    
    return timeMappings[timePart] || 'Mon, Wed, Fri';
  };

  const getClassStatus = (classItem) => {
    if (!classItem.created_at) return { status: 'active', label: 'Active', color: 'status-active' };
    
    try {
      const created = new Date(classItem.created_at);
      const now = new Date();
      const diffTime = Math.abs(now - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) return { status: 'new', label: 'New', color: 'status-new' };
      if (classItem.total_registered_students > 40) return { status: 'popular', label: 'Popular', color: 'status-popular' };
      if (classItem.total_registered_students < 10) return { status: 'small', label: 'Small', color: 'status-small' };
      return { status: 'active', label: 'Active', color: 'status-active' };
    } catch (error) {
      return { status: 'active', label: 'Active', color: 'status-active' };
    }
  };

  const calculateStats = () => {
    const filteredClasses = getFilteredClasses();
    const totalClasses = filteredClasses.length;
    const totalStudents = filteredClasses.reduce((sum, cls) => sum + (parseInt(cls.total_registered_students) || 0), 0);
    const averageClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

    return {
      totalClasses,
      totalStudents,
      averageClassSize,
      activeClasses: totalClasses
    };
  };

  const getFilteredClasses = () => {
    if (!classes || classes.length === 0) return [];
    
    return classes.filter(cls => {
      const facultyMatch = filterFaculty === 'all' || 
                          (cls.faculty_id && cls.faculty_id.toString() === filterFaculty);
      const statusMatch = filterStatus === 'all' || getClassStatus(cls).status === filterStatus;
      return facultyMatch && statusMatch;
    });
  };

  const filteredClasses = getFilteredClasses();
  const stats = calculateStats();

  const handleViewLectures = (classId) => {
    onNavigate('Lectures', { classId });
  };

  const handleCreateLecture = (classItem) => {
    onNavigate('Create Lecture', { 
      classId: classItem.id,
      className: classItem.class_name 
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="lecture-classes-container">
      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => onNavigate('Dashboard')}>
          Home
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">
          {isLecturer ? 'My Teaching Classes' : 'All Classes'}
        </span>
      </div>

      <div className="quick-navigation">
        <h4>Quick Navigation</h4>
        <div className="nav-buttons">
          <button onClick={() => onNavigate('Dashboard')}>Dashboard</button>
          <button onClick={() => onNavigate('Lectures')}>Lectures</button>
          {isLecturer && (
            <button onClick={() => onNavigate('Create Lecture')}>Create Lecture</button>
          )}
          <button onClick={() => onNavigate('Monitoring')}>Monitoring</button>
        </div>
      </div>

      <div className="classes-content">
        <header className="classes-header">
          <div className="header-text">
            <h1>{isLecturer ? 'My Teaching Classes' : 'All Classes'}</h1>
            <p>
              {isLecturer 
                ? "View classes you have taught or are scheduled to teach"
                : "Browse and manage all classes in the system"
              }
            </p>
            {isLecturer && classes.length === 0 && (
              <div className="access-warning">
                <p>⚠️ You haven't taught any classes yet. Create your first lecture to get started.</p>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button 
              onClick={refreshData}
              className="btn btn-outline"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            {isLecturer && classes.length > 0 && (
              <button 
                onClick={() => onNavigate('Create Lecture')}
                className="btn btn-primary"
              >
                Create New Lecture
              </button>
            )}
          </div>
        </header>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {classes.length > 0 && (
          <>
            <div className="filters-section">
              <div className="filter-group">
                <label>Filter by Faculty:</label>
                <select 
                  value={filterFaculty} 
                  onChange={(e) => setFilterFaculty(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Faculties</option>
                  {faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Filter by Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="popular">Popular</option>
                  <option value="small">Small</option>
                </select>
              </div>
              <div className="filter-group">
                <button 
                  onClick={() => {
                    setFilterFaculty('all');
                    setFilterStatus('all');
                  }}
                  className="btn btn-outline"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.totalClasses}</h3>
                  <p>Total Classes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.totalStudents}</h3>
                  <p>Total Students</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.averageClassSize}</h3>
                  <p>Avg. Class Size</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.activeClasses}</h3>
                  <p>Active Classes</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && (
          <div className="classes-table-container">
            <table className="classes-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Students</th>
                  <th>Schedule</th>
                  <th>Location</th>
                  <th>Faculty</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map(cls => {
                  const studentCount = parseInt(cls.total_registered_students) || 0;
                  const capacityPercentage = Math.min((studentCount / 50) * 100, 100);

                  return (
                    <tr key={cls.id}>
                      <td className="course-name">
                        <div className="course-name-cell">
                          <strong>{cls.class_name || 'Unnamed Class'}</strong>
                          <div className="class-id">ID: {cls.id}</div>
                        </div>
                      </td>
                      <td className="students-info">
                        <div className="students-count">{studentCount}</div>
                        <div className="enrolled-text">enrolled</div>
                      </td>
                      <td className="schedule-info">
                        <div className="schedule-time">{formatTimeDisplay(cls.scheduled_time)}</div>
                        <div className="schedule-days">{getWeekdayFromTime(cls.scheduled_time)}</div>
                      </td>
                      <td className="location-info">{cls.venue || 'Not specified'}</td>
                      <td className="faculty-info">{cls.faculty_name || getFacultyName(cls.faculty_id)}</td>
                      <td className="capacity-info">
                        <div className="capacity-count">{Math.round(capacityPercentage)}%</div>
                        <div className="capacity-label">({studentCount}/50)</div>
                      </td>
                      <td className="action-buttons">
                        <button
                          onClick={() => handleViewLectures(cls.id)}
                          className="view-lectures-btn"
                        >
                          View Lectures
                        </button>
                        {isLecturer && (
                          <button
                            onClick={() => handleCreateLecture(cls)}
                            className="view-lectures-btn"
                            style={{ marginLeft: '0.5rem', background: '#007bff', color: 'white' }}
                          >
                            Create Lecture
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredClasses.length === 0 && classes.length > 0 && (
          <div className="no-classes">
            <h3>No Classes Match Your Filters</h3>
            <p>Try adjusting your filters to see more classes.</p>
            <button 
              onClick={() => {
                setFilterFaculty('all');
                setFilterStatus('all');
              }}
              className="btn btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {!loading && classes.length === 0 && (
          <div className="no-classes">
            <h3>No Classes Found</h3>
            <p>
              {isLecturer 
                ? "You haven't taught any classes yet. Create your first lecture report to get started."
                : "No classes have been created in the system yet. Classes can be created in the Class Management section."
              }
            </p>
            {isLecturer ? (
              <button 
                onClick={() => onNavigate('Create Lecture')}
                className="btn btn-primary"
              >
                Create First Lecture
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('Class Management')}
                className="btn btn-primary"
              >
                Go to Class Management
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .lecture-classes-container {
          color: white;
          padding: 2rem;
          background: #000;
          min-height: 100vh;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .breadcrumb-item {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          text-decoration: underline;
        }

        .breadcrumb-item:hover {
          color: white;
        }

        .breadcrumb-separator {
          margin: 0 0.5rem;
          color: #666;
        }

        .breadcrumb-current {
          color: white;
          font-weight: 500;
        }

        .quick-navigation {
          margin-bottom: 2rem;
          width: calc(100% + 20px);
          margin-left: -10px;
          margin-right: -10px;
          padding-left: 10px;
          padding-right: 10px;
        }

        .quick-navigation h4 {
          margin-bottom: 1rem;
          color: white;
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .nav-buttons button {
          padding: 0.5rem 1rem;
          background: transparent;
          color: white;
          border: 2px solid black;
          border-radius: 4px;
          cursor: pointer;
        }

        .nav-buttons button:hover {
          background: rgba(255, 255, 255, 0.1 
        }

        .classes-content {
          background: #111;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .classes-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          border-bottom: 1px solid #333;
          padding-bottom: 1rem;
        }

        .header-text h1 {
          margin: 0 0 0.5rem 0;
          color: white;
          font-size: 2rem;
        }

        .header-text p {
          color: #ccc;
          margin: 0;
        }

        .access-warning {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid orange;
          border-radius: 4px;
        }

        .access-warning p {
          margin: 0;
          color: orange;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #555;
          color: #ccc;
        }

        .btn-outline:hover {
          background: #555;
          color: white;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
          font-weight: 500;
        }

        .message.success {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          color: #28a745;
        }

        .message.error {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #dc3545;
        }

        .filters-section {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          color: #ccc;
          font-weight: 500;
        }

        .filter-select {
          padding: 0.5rem;
          background: #222;
          color: white;
          border: 1px solid #555;
          border-radius: 4px;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #1a1a1a;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #333;
          text-align: center;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: white;
          font-size: 2rem;
        }

        .stat-content p {
          margin: 0;
          color: #ccc;
        }

        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .class-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .class-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem;
          background: #222;
        }

        .class-info h3 {
          margin: 0 0 0.25rem 0;
          color: white;
          font-size: 1.2rem;
        }

        .class-code {
          color: #ccc;
          font-size: 0.8rem;
        }

        .class-status {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-active {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
          border: 1px solid #28a745;
        }

        .status-new {
          background: rgba(0, 123, 255, 0.2);
          color: #007bff;
          border: 1px solid #007bff;
        }

        .status-popular {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
          border: 1px solid #ffc107;
        }

        .status-small {
          background: rgba(108, 117, 125, 0.2);
          color: #6c757d;
          border: 1px solid #6c757d;
        }

        .class-details {
          padding: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .detail-label {
          color: #ccc;
          font-weight: 500;
        }

        .detail-value {
          color: white;
          text-align: right;
        }

        .card-progress {
          padding: 1rem;
          background: #111;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .progress-label {
          color: #ccc;
        }

        .progress-value {
          color: white;
          font-weight: 500;
        }

        .progress-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #28a745);
          border-radius: 4px;
        }

        .card-actions {
          padding: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
        }

        .card-footer {
          padding: 1rem;
          background: #222;
          border-top: 1px solid #333;
        }

        .footer-meta {
          color: #ccc;
          font-size: 0.8rem;
        }

        .no-classes {
          text-align: center;
          padding: 3rem;
          color: #ccc;
        }

        .no-classes h3 {
          margin: 0 0 1rem 0;
          color: white;
        }

        .no-classes p {
          margin: 0 0 2rem 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: #ccc;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #333;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .classes-grid {
            grid-template-columns: 1fr;
          }

          .classes-header {
            flex-direction: column;
            gap: 1rem;
          }

          .filters-section {
            flex-direction: column;
          }

          .stats-overview {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LectureClasses;
