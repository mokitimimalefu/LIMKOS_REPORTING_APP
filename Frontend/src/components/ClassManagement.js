import React, { useState, useEffect } from "react";
import { getClasses, postClass, getAllFaculties, updateClass, deleteClass, getCurrentUser } from "../api";

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({
    class_name: "",
    faculty_id: "",
    total_registered_students: "",
    venue: "",
    scheduled_time: "09:00",
  });
  const [editingClass, setEditingClass] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const classesData = await getClasses();
      setClasses(classesData);
    } catch (err) {
      setMessage(`Failed to load classes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const facultiesData = await getAllFaculties();
      console.log("Fetched faculties:", facultiesData); // Debug log
      setFaculties(facultiesData);
    } catch (err) {
      console.error("Error fetching faculties:", err);
      setMessage(`Failed to load faculties: ${err.message}`);
      // Fallback to empty array if API fails
      setFaculties([]);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchClasses();
    fetchFaculties();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const classData = {
        ...form,
        total_registered_students: Number(form.total_registered_students),
        faculty_id: Number(form.faculty_id),
        scheduled_time: form.scheduled_time + ':00'
      };

      if (editingClass) {
        await updateClass(editingClass.id, classData);
        setMessage("Class updated successfully!");
      } else {
        await postClass(classData);
        setMessage("Class added successfully!");
      }

      setForm({ 
        class_name: "", 
        faculty_id: "", 
        total_registered_students: "", 
        venue: "", 
        scheduled_time: "09:00" 
      });
      setEditingClass(null);
      setShowForm(false);
      fetchClasses();
    } catch (err) {
      setMessage(`Failed to ${editingClass ? "update" : "add"} class: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    
    const timeValue = cls.scheduled_time ? cls.scheduled_time.substring(0, 5) : "09:00";
    
    setForm({
      class_name: cls.class_name,
      faculty_id: cls.faculty_id.toString(),
      total_registered_students: cls.total_registered_students.toString(),
      venue: cls.venue,
      scheduled_time: timeValue,
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class? This will also delete any associated lectures and assignments.")) return;
    try {
      await deleteClass(classId);
      setMessage("Class deleted successfully!");
      fetchClasses();
    } catch (err) {
      setMessage(`Failed to delete class: ${err.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingClass(null);
    setForm({ 
      class_name: "", 
      faculty_id: "", 
      total_registered_students: "", 
      venue: "", 
      scheduled_time: "09:00" 
    });
    setShowForm(false);
  };

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : "Unknown Faculty";
  };

  const formatTimeDisplay = (time) => {
    if (!time) return "Not scheduled";
    
    const timeMappings = {
      '09:00:00': '09:00 - 10:30',
      '10:30:00': '10:30 - 12:00', 
      '14:00:00': '14:00 - 15:30',
      '15:30:00': '15:30 - 17:00'
    };
    
    return timeMappings[time] || time.substring(0, 5) + ' - ' + (parseInt(time.substring(0, 2)) + 1) + time.substring(2, 5);
  };

  const getWeekdayFromTime = (time) => {
    if (!time) return 'Mon, Wed, Fri';
    
    const timeMappings = {
      '09:00:00': 'Mon, Wed, Fri',
      '10:30:00': 'Tue, Thu',
      '14:00:00': 'Mon, Wed',
      '15:30:00': 'Tue, Thu, Fri'
    };
    return timeMappings[time] || 'Mon, Wed, Fri';
  };

  const getClassStatus = (classItem) => {
    const created = new Date(classItem.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return { status: 'new', label: 'New', color: 'status-new' };
    if (classItem.total_registered_students > 40) return { status: 'popular', label: 'Popular', color: 'status-popular' };
    return { status: 'active', label: 'Active', color: 'status-active' };
  };

  const calculateStats = () => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_registered_students || 0), 0);
    const averageClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
    const activeVenues = new Set(classes.map(c => c.venue)).size;

    return {
      totalClasses,
      totalStudents,
      averageClassSize,
      activeVenues
    };
  };

  const stats = calculateStats();

  // Check if user can manage classes - Updated to include principal_lecturer and program_leader
  const canManageClasses = user && ['admin', 'principal_lecturer', 'program_leader'].includes(user.role);

  return (
    <div className="management-container">
      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => window.history.back()}>
          Home
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Class Management</span>
      </div>

      <div className="quick-navigation">
        <h4>Quick Navigation</h4>
        <div className="nav-buttons">
          <button onClick={() => window.location.reload()}>Dashboard</button>
          {canManageClasses && <button onClick={() => setShowForm(true)}>Add Class</button>}
          <button onClick={fetchClasses}>Refresh Data</button>
        </div>
      </div>

      <div className="management-content">
        <header className="management-header">
          <div className="header-text">
            <h1>Class Management</h1>
            <p>Manage classes, venues, and schedules across all faculties</p>
            {!canManageClasses && (
              <div className="access-warning">
                <p>⚠️ Read-only access: You don't have permission to modify classes</p>
              </div>
            )}
          </div>
          {canManageClasses && (
            <div className="header-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setEditingClass(null);
                  setForm({ 
                    class_name: "", 
                    faculty_id: faculties.length > 0 ? faculties[0].id.toString() : "", 
                    total_registered_students: "", 
                    venue: "", 
                    scheduled_time: "09:00" 
                  });
                  setShowForm(!showForm);
                }}
              >
                {showForm ? "View Classes" : "Add New Class"}
              </button>
            </div>
          )}
        </header>

        {message && (
          <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {showForm && canManageClasses ? (
          <div className="form-container">
            <div className="form-header">
              <h2>{editingClass ? "Edit Class" : "Add New Class"}</h2>
              <p>Complete all required fields to {editingClass ? "update" : "create"} a class</p>
            </div>
            
            <form onSubmit={handleSubmit} className="management-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Class Name</label>
                  <input 
                    type="text" 
                    name="class_name" 
                    value={form.class_name} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                    placeholder="Enter class name (e.g., CS101-A)"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Faculty</label>
                  <select 
                    name="faculty_id" 
                    value={form.faculty_id} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  {faculties.length === 0 && (
                    <div className="form-warning">
                      No faculties available. Please check database connection.
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Total Students</label>
                  <input 
                    type="number" 
                    name="total_registered_students" 
                    value={form.total_registered_students} 
                    onChange={handleChange} 
                    required 
                    min="1" 
                    max="200"
                    className="form-input"
                    placeholder="Expected number of students"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input 
                    type="text" 
                    name="venue" 
                    value={form.venue} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                    placeholder="Enter classroom or venue"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Scheduled Time</label>
                  <select
                    name="scheduled_time" 
                    value={form.scheduled_time} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                  >
                    <option value="09:00">09:00 - 10:30 (Morning)</option>
                    <option value="10:30">10:30 - 12:00 (Late Morning)</option>
                    <option value="14:00">14:00 - 15:30 (Afternoon)</option>
                    <option value="15:30">15:30 - 17:00 (Late Afternoon)</option>
                  </select>
                </div>
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
                  disabled={loading || !form.faculty_id}
                >
                  {loading ? "Processing..." : editingClass ? "Update Class" : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="stats-overview">
              <div className="stats-row">
                <div className="stat-card narrow">
                  <div className="stat-content">
                    <h3>{stats.totalClasses}</h3>
                    <p>Total Classes</p>
                  </div>
                </div>
                <div className="stat-card narrow">
                  <div className="stat-content">
                    <h3>{stats.totalStudents}</h3>
                    <p>Total Students</p>
                  </div>
                </div>
              </div>
              <div className="stats-row">
                <div className="stat-card narrow">
                  <div className="stat-content">
                    <h3>{stats.averageClassSize}</h3>
                    <p>Avg. Class Size</p>
                  </div>
                </div>
                <div className="stat-card narrow">
                  <div className="stat-content">
                    <h3>{stats.activeVenues}</h3>
                    <p>Active Venues</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-container">
              <div className="table-header">
                <h3>All Classes</h3>
                <div className="table-actions">
                  <button onClick={fetchClasses} className="btn btn-outline">
                    Refresh
                  </button>
                  {canManageClasses && (
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                      Add Class
                    </button>
                  )}
                </div>
              </div>
              
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Faculty</th>
                      <th>Students</th>
                      <th>Venue</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      {canManageClasses && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={canManageClasses ? "8" : "7"} className="loading-cell">
                          <div className="loading-spinner"></div>
                          Loading classes...
                        </td>
                      </tr>
                    ) : classes.map(cls => {
                      const status = getClassStatus(cls);
                      return (
                        <tr key={cls.id}>
                          <td>
                            <div className="class-name-cell">
                              <strong>{cls.class_name}</strong>
                              <span className="class-id">ID: {cls.id}</span>
                            </div>
                          </td>
                          <td>
                            {cls.faculty_name || getFacultyName(cls.faculty_id)}
                          </td>
                          <td>
                            <div className="student-count">
                              {cls.total_registered_students}
                              <span className="capacity-indicator">
                                {Math.round((cls.total_registered_students / 50) * 100)}% capacity
                              </span>
                            </div>
                          </td>
                          <td>{cls.venue}</td>
                          <td>
                            <div className="schedule-info">
                              <div className="schedule-time">{formatTimeDisplay(cls.scheduled_time)}</div>
                              <div className="schedule-days">{getWeekdayFromTime(cls.scheduled_time)}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td>{new Date(cls.created_at).toLocaleDateString()}</td>
                          {canManageClasses && (
                            <td>
                              <div className="action-buttons">
                                <button 
                                  onClick={() => handleEdit(cls)}
                                  className="btn btn-sm btn-outline"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDelete(cls.id)}
                                  className="btn btn-sm btn-danger"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {!loading && classes.length === 0 && (
                      <tr>
                        <td colSpan={canManageClasses ? "8" : "7"} className="no-data">
                          <div className="no-data-content">
                            <h4>No Classes Found</h4>
                            <p>Get started by creating your first class</p>
                            {canManageClasses && (
                              <button 
                                onClick={() => setShowForm(true)}
                                className="btn btn-primary"
                              >
                                Create First Class
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}