import React, { useState, useEffect } from "react";
import { 
  getCourses, 
  postCourse, 
  getUsersByRole, 
  updateCourse, 
  deleteCourse,
  getCurrentUser
} from "../api";

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [programLeaders, setProgramLeaders] = useState([]);
  const [form, setForm] = useState({ course_code: "", course_name: "", program_leader_id: "" });
  const [editingCourse, setEditingCourse] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchCourses();
    // Only fetch program leaders if user is admin or principal_lecturer
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'principal_lecturer')) {
      fetchProgramLeaders();
    }
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setMessage(`Failed to load courses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramLeaders = async () => {
    try {
      const data = await getUsersByRole("program_leader");
      setProgramLeaders(data);
    } catch (err) {
      setMessage(`Failed to load program leaders: ${err.message}`);
      // Mock data for fallback
      setProgramLeaders([
        { id: 1, name: "Dr. Smith", email: "smith@university.edu" },
        { id: 2, name: "Prof. Johnson", email: "johnson@university.edu" }
      ]);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // For program leaders, automatically use their own ID
      let payload;
      if (user?.role === 'program_leader') {
        payload = { 
          course_code: form.course_code, 
          course_name: form.course_name 
        };
      } else {
        payload = { 
          course_code: form.course_code, 
          course_name: form.course_name,
          program_leader_id: form.program_leader_id ? Number(form.program_leader_id) : null 
        };
      }
      
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        setMessage("Course updated successfully!");
      } else {
        await postCourse(payload);
        setMessage("Course added successfully!");
      }
      setForm({ course_code: "", course_name: "", program_leader_id: "" });
      setEditingCourse(null);
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      setMessage(`Failed to save course: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    // Check if user can edit this course
    if (user?.role === 'program_leader' && course.program_leader_id !== user.id) {
      setMessage("You can only edit your own courses");
      return;
    }
    
    setEditingCourse(course);
    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      program_leader_id: course.program_leader_id?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const courseToDelete = courses.find(c => c.id === id);
    
    // Check if user can delete this course
    if (user?.role === 'program_leader' && courseToDelete.program_leader_id !== user.id) {
      setMessage("You can only delete your own courses");
      return;
    }

    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        await deleteCourse(id);
        setMessage("Course deleted successfully!");
        fetchCourses();
      } catch (err) {
        setMessage(`Failed to delete: ${err.message}`);
      }
    }
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setForm({ course_code: "", course_name: "", program_leader_id: "" });
    setShowForm(false);
  };

  const getLeaderName = (id) => {
    if (!id) return "Not assigned";
    const leader = programLeaders.find((l) => l.id === id);
    return leader ? leader.name : "Unknown Leader";
  };

  const getLeaderEmail = (id) => {
    if (!id) return "";
    const leader = programLeaders.find((l) => l.id === id);
    return leader ? leader.email : "";
  };

  // Check user permissions
  const canManageCourses = user && (user.role === 'admin' || user.role === 'program_leader');
  const canAddCourses = user && user.role === 'program_leader';
  const canSeeAllCourses = user && (user.role === 'admin' || user.role === 'principal_lecturer');
  const canEditCourse = (course) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'program_leader' && course.program_leader_id === user.id) return true;
    return false;
  };

  const calculateStats = () => {
    let filteredCourses = courses;
    
    // Program leaders only see their own courses in stats
    if (user?.role === 'program_leader') {
      filteredCourses = courses.filter(c => c.program_leader_id === user.id);
    }
    
    const totalCourses = filteredCourses.length;
    const assignedCourses = filteredCourses.filter(c => c.program_leader_id).length;
    const unassignedCourses = totalCourses - assignedCourses;
    const uniqueLeaders = new Set(filteredCourses.map(c => c.program_leader_id).filter(id => id)).size;

    return {
      totalCourses,
      assignedCourses,
      unassignedCourses,
      uniqueLeaders
    };
  };

  const stats = calculateStats();

  // Filter courses based on user role
  const displayCourses = user?.role === 'program_leader' 
    ? courses.filter(course => course.program_leader_id === user.id)
    : courses;

  return (
    <div className="management-container">
      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => window.history.back()}>
          Home
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Course Management</span>
      </div>

      <div className="quick-navigation">
        <h4>Quick Navigation</h4>
        <div className="nav-buttons">
          <button onClick={() => window.location.reload()}>Dashboard</button>
          {canAddCourses && <button onClick={() => setShowForm(true)}>Add Course</button>}
          <button onClick={fetchCourses}>Refresh Data</button>
        </div>
      </div>

      <div className="management-content">
        <header className="management-header">
          <div className="header-text">
            <h1>Course Management</h1>
            <p>
              {user?.role === 'program_leader' 
                ? "Manage your courses and teaching assignments" 
                : "Manage courses and program leader assignments across the university"}
            </p>
            {!canManageCourses && (
              <div className="access-warning">
                <p>⚠️ Read-only access: You don't have permission to modify courses</p>
              </div>
            )}
            {user?.role === 'program_leader' && (
              <div className="access-info">
                <p>ℹ️ You can only view and manage your own courses</p>
              </div>
            )}
          </div>
          {canAddCourses && (
            <div className="header-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setEditingCourse(null);
                  setForm({ course_code: "", course_name: "", program_leader_id: "" });
                  setShowForm(!showForm);
                }}
              >
                {showForm ? "View Courses" : "Add New Course"}
              </button>
            </div>
          )}
        </header>

        {message && (
          <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {showForm && canAddCourses ? (
          <div className="form-container">
            <div className="form-header">
              <h2>{editingCourse ? "Edit Course" : "Add New Course"}</h2>
              <p>Define course details {user?.role === 'program_leader' ? 'for your teaching portfolio' : 'and assign program leadership'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="management-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    name="course_code"
                    value={form.course_code}
                    onChange={handleChange}
                    placeholder="Enter course code (e.g., CS101)"
                    required
                    className="form-input"
                  />
                  <div className="input-helper">
                    Unique identifier for the course
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    name="course_name"
                    value={form.course_name}
                    onChange={handleChange}
                    placeholder="Enter full course name"
                    required
                    className="form-input"
                  />
                  <div className="input-helper">
                    Official name of the course
                  </div>
                </div>

                {/* Only show program leader dropdown for admin/principal_lecturer */}
                {(user?.role === 'admin' || user?.role === 'principal_lecturer') && (
                  <div className="form-group full-width">
                    <label className="form-label">Program Leader</label>
                    <select
                      name="program_leader_id"
                      value={form.program_leader_id}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="">Select Program Leader (Optional)</option>
                      {programLeaders.map((leader) => (
                        <option key={leader.id} value={leader.id}>
                          {leader.name} - {leader.email}
                        </option>
                      ))}
                    </select>
                    <div className="input-helper">
                      Responsible faculty member for this course
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Processing..." : editingCourse ? "Update Course" : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.totalCourses}</h3>
                  <p>Total Courses</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.uniqueLeaders}</h3>
                  <p>Program Leaders</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.assignedCourses}</h3>
                  <p>Assigned Courses</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <h3>{stats.unassignedCourses}</h3>
                  <p>Unassigned Courses</p>
                </div>
              </div>
            </div>

            <div className="table-container">
              <div className="table-header">
                <h3>
                  {user?.role === 'program_leader' ? 'My Courses' : 'Course Catalog'}
                  {user?.role === 'program_leader' && ` (${displayCourses.length})`}
                </h3>
                <div className="table-actions">
                  <button onClick={fetchCourses} className="btn btn-outline">
                    Refresh
                  </button>
                  {canAddCourses && (
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                      Add Course
                    </button>
                  )}
                </div>
              </div>
              
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      {canSeeAllCourses && <th>Program Leader</th>}
                      {canSeeAllCourses && <th>Contact Email</th>}
                      <th>Status</th>
                      {canManageCourses && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={canManageCourses ? (canSeeAllCourses ? "6" : "4") : (canSeeAllCourses ? "5" : "3")} className="loading-cell">
                          <div className="loading-spinner"></div>
                          Loading courses...
                        </td>
                      </tr>
                    ) : displayCourses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <div className="course-code-cell">
                            <strong>{course.course_code}</strong>
                            <span className="course-id">ID: {course.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="course-name-cell">
                            <strong>{course.course_name}</strong>
                            <span className="course-meta">
                              Created: {new Date(course.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        {canSeeAllCourses && (
                          <td>
                            <div className="leader-cell">
                              <div className="leader-name">{getLeaderName(course.program_leader_id)}</div>
                              {getLeaderEmail(course.program_leader_id) && (
                                <div className="leader-email">{getLeaderEmail(course.program_leader_id)}</div>
                              )}
                            </div>
                          </td>
                        )}
                        {canSeeAllCourses && (
                          <td>
                            {getLeaderEmail(course.program_leader_id) || "Not available"}
                          </td>
                        )}
                        <td>
                          <div className={`status-badge ${course.program_leader_id ? 'active' : 'inactive'}`}>
                            {course.program_leader_id ? 'Active' : 'Unassigned'}
                          </div>
                        </td>
                        {canManageCourses && (
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEdit(course)}
                                className="btn btn-sm btn-outline"
                                disabled={!canEditCourse(course)}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(course.id)}
                                className="btn btn-sm btn-danger"
                                disabled={!canEditCourse(course)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {!loading && displayCourses.length === 0 && (
                      <tr>
                        <td colSpan={canManageCourses ? (canSeeAllCourses ? "6" : "4") : (canSeeAllCourses ? "5" : "3")} className="no-data">
                          <div className="no-data-content">
                            <h4>No Courses Found</h4>
                            <p>
                              {user?.role === 'program_leader' 
                                ? "You haven't created any courses yet" 
                                : "Start building your course catalog by adding the first course"}
                            </p>
                            {canAddCourses && (
                              <button 
                                onClick={() => setShowForm(true)}
                                className="btn btn-primary"
                              >
                                Add Your First Course
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="footer-info">
                  <span>Showing {displayCourses.length} courses</span>
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .management-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .access-info {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 4px;
          padding: 8px 12px;
          margin-top: 8px;
        }
        
        .access-info p {
          margin: 0;
          color: #0c5460;
          font-size: 0.9em;
        }
        
        .loading-cell {
          text-align: center;
          padding: 40px;
        }
        
        .loading-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .access-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 8px 12px;
          margin-top: 8px;
        }
        
        .access-warning p {
          margin: 0;
          color: #856404;
          font-size: 0.9em;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 500;
          display: inline-block;
        }
        
        .status-badge.active {
          background-color: #d4edda;
          color: #155724;
        }
        
        .status-badge.inactive {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .course-code-cell {
          display: flex;
          flex-direction: column;
        }
        
        .course-id {
          font-size: 0.8em;
          color: #666;
          margin-top: 2px;
        }
        
        .course-name-cell {
          display: flex;
          flex-direction: column;
        }
        
        .course-meta {
          font-size: 0.8em;
          color: #666;
          margin-top: 2px;
        }
        
        .leader-cell {
          display: flex;
          flex-direction: column;
        }
        
        .leader-name {
          font-weight: 500;
        }
        
        .leader-email {
          font-size: 0.8em;
          color: #666;
          margin-top: 2px;
        }
        
        .input-helper {
          font-size: 0.8em;
          color: #666;
          margin-top: 4px;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .action-buttons button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}