import React, { useState, useEffect, useCallback } from "react";
import { getClasses, getCourses, postLecture, getCurrentUser, fetchLectures, postRating, postFeedback } from "../api";

export default function LectureForm({ user }) {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    class_id: "",
    course_id: "",
    week_of_reporting: "",
    date_of_lecture: "",
    actual_students_present: "",
    topic_taught: "",
    learning_outcomes: "",
    recommendations: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Add state for student rating functionality
  const [lectures, setLectures] = useState([]);
  const [ratings, setRatings] = useState({});
  const [ratingLoading, setRatingLoading] = useState(false);
  const [selectedLectureForRating, setSelectedLectureForRating] = useState(null);
  const [userFeedback, setUserFeedback] = useState("");

  // Fetch ALL classes regardless of assignment
  const fetchClasses = useCallback(async () => {
    try {
      console.log("Fetching ALL classes for user:", user);
      // Try the new endpoint first
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/all-classes", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const classesData = await response.json();
        console.log("All classes data:", classesData);
        setClasses(Array.isArray(classesData) ? classesData : []);
      } else {
        // Fallback to regular API call
        console.log("Using fallback classes endpoint");
        const classesData = await getClasses();
        console.log("Fallback classes data:", classesData);
        setClasses(Array.isArray(classesData) ? classesData : []);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
      // Try regular API as last resort
      try {
        const classesData = await getClasses();
        setClasses(Array.isArray(classesData) ? classesData : []);
      } catch (fallbackError) {
        setMessage("Failed to load classes. Please try again.");
        setClasses([]);
      }
    }
  }, [user]);

  // Fetch ALL courses regardless of assignment
  const fetchCourses = useCallback(async () => {
    try {
      console.log("Fetching ALL courses for user:", user);
      // Try the new endpoint first
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/all-courses", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const coursesData = await response.json();
        console.log("All courses data:", coursesData);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } else {
        // Fallback to regular API call
        console.log("Using fallback courses endpoint");
        const coursesData = await getCourses();
        console.log("Fallback courses data:", coursesData);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      // Try regular API as last resort
      try {
        const coursesData = await getCourses();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (fallbackError) {
        setMessage("Failed to load courses. Please try again.");
        setCourses([]);
      }
    }
  }, [user]);

  // Load lectures for students
  const loadLecturesForStudent = useCallback(async () => {
    try {
      const lecturesData = await fetchLectures();
      // Filter lectures that have already happened (past dates)
      const pastLectures = lecturesData.filter(lecture =>
        new Date(lecture.date_of_lecture) <= new Date()
      );
      setLectures(pastLectures);
    } catch (error) {
      console.error("Failed to load lectures:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        setMessage("");

        // Get current user to ensure proper authentication
        const userData = getCurrentUser();
        setCurrentUser(userData);
        console.log("Current user in LectureForm:", userData);

        // Load classes and courses sequentially to avoid race conditions
        await fetchClasses();
        await fetchCourses();

        // Load lectures for students
        if (userData && userData.role === 'student') {
          await loadLecturesForStudent();
        }

      } catch (error) {
        console.error("Failed to load data:", error);
        setMessage("Failed to load form data. Please refresh the page.");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [fetchClasses, fetchCourses, loadLecturesForStudent]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'class_id') {
      const selected = classes.find(c => c.id === parseInt(value));
      console.log("Selected class:", selected);
      setSelectedClass(selected || null);
    }

    if (name === 'course_id') {
      const selected = courses.find(c => c.id === parseInt(value));
      console.log("Selected course:", selected);
      setSelectedCourse(selected || null);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Validate required fields
    if (!form.class_id || !form.course_id || !form.date_of_lecture) {
      setMessage("Error: Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      console.log("Submitting form data:", form);
      const result = await postLecture(form);
      console.log("Submission result:", result);
      setMessage("Lecture report submitted successfully!");

      // Reset form
      setForm({
        class_id: "",
        course_id: "",
        week_of_reporting: "",
        date_of_lecture: "",
        actual_students_present: "",
        topic_taught: "",
        learning_outcomes: "",
        recommendations: "",
      });
      setStep(1);
      setSelectedClass(null);
      setSelectedCourse(null);

      // Refresh the data
      await fetchClasses();
      await fetchCourses();
    } catch (err) {
      console.error("Submission error:", err);
      setMessage(`Error: ${err.message || "Failed to submit lecture report"}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.class_id || !form.course_id) {
        setMessage("Please select both class and course before proceeding");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.date_of_lecture || !form.week_of_reporting) {
        setMessage("Please fill all required fields before proceeding");
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setMessage("");
  };

  // Handle rating submission for students
  const handleRateLecture = async (lectureId, rating) => {
    try {
      setRatingLoading(true);
      await postRating({ lecture_id: lectureId, rating });
      setRatings(prev => ({
        ...prev,
        [lectureId]: { rating }
      }));
      setMessage("Rating submitted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRatingLoading(false);
    }
  };

  // Handle feedback submission for students
  const handleSubmitFeedback = async (lectureId) => {
    try {
      setRatingLoading(true);
      await postFeedback({
        lecture_id: lectureId,
        feedback_text: userFeedback
      });
      setMessage("Feedback submitted successfully!");
      setUserFeedback("");
      setSelectedLectureForRating(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRatingLoading(false);
    }
  };

  // Check if user can submit lectures
  const canSubmitLectures = currentUser && ['lecturer', 'principal_lecturer'].includes(currentUser.role);

  // Check if user is student
  const isStudent = currentUser && currentUser.role === 'student';

  if (!canSubmitLectures && !isStudent) {
    return (
      <div className="container">
        <div className="permission-denied">
          <h3>Access Denied</h3>
          <p>You do not have permission to submit lecture reports. Required role: Lecturer or Principal Lecturer.</p>
          <p>Your current role: {currentUser?.role || 'Not logged in'}</p>
        </div>

        <style jsx>{`
          .container {
            min-height: 100vh;
            background: #0f0f0f;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .permission-denied {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            color: white;
            max-width: 500px;
            border: 1px solid #333;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          }
          .permission-denied h3 {
            color: #ef4444;
            margin-bottom: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      {isStudent ? (
        // Student Rating Interface
        <div className="content-wrapper">
          <div className="form-header">
            <div className="header-content">
              <div className="user-info-header">
                <div className="user-avatar">{currentUser?.name?.charAt(0) || 'U'}</div>
                <div className="user-details">
                  <div className="user-name">{currentUser?.name}</div>
                  <div className="user-role">{currentUser?.role}</div>
                </div>
              </div>
              <div className="header-text">
                <h2>Rate Lectures</h2>
                <p>Rate your lectures and provide feedback to help improve teaching quality</p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <div className="rating-interface">
            <div className="section-header">
              <h3>Available Lectures for Rating</h3>
              <p>Select lectures to rate and provide feedback</p>
            </div>
            
            <div className="lectures-grid">
              {lectures.map(lecture => (
                <div key={lecture.id} className="lecture-card">
                  <div className="card-header">
                    <h4>{lecture.course_name}</h4>
                    <div className="lecture-date">
                      {new Date(lecture.date_of_lecture).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="lecture-details">
                    <div className="detail-row">
                      <span className="detail-label">Topic:</span>
                      <span className="detail-value">{lecture.topic_taught}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Lecturer:</span>
                      <span className="detail-value">{lecture.lecturer_name}</span>
                    </div>
                  </div>
                  <div className="rating-section">
                    <div className="rating-header">
                      <label>Your Rating:</label>
                      {ratings[lecture.id] && (
                        <span className="current-rating">
                          {ratings[lecture.id].rating}/5
                        </span>
                      )}
                    </div>
                    <div className="stars-container">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star ${star <= (ratings[lecture.id]?.rating || 0) ? 'filled' : ''}`}
                          onClick={() => handleRateLecture(lecture.id, star)}
                          disabled={ratingLoading}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-outline full-width"
                      onClick={() => setSelectedLectureForRating(lecture)}
                    >
                      Add Detailed Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {lectures.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h4>No Lectures Available</h4>
                <p>There are no lectures available for rating at the moment.</p>
              </div>
            )}
          </div>

          {selectedLectureForRating && (
            <div className="feedback-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Provide Feedback</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setSelectedLectureForRating(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="lecture-info-modal">
                    <p><strong>Course:</strong> {selectedLectureForRating.course_name}</p>
                    <p><strong>Topic:</strong> {selectedLectureForRating.topic_taught}</p>
                    <p><strong>Date:</strong> {new Date(selectedLectureForRating.date_of_lecture).toLocaleDateString()}</p>
                  </div>
                  <textarea
                    placeholder="Share your thoughts about this lecture. What did you like? What could be improved?"
                    rows="6"
                    className="form-input"
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedLectureForRating(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmitFeedback(selectedLectureForRating.id)}
                    disabled={ratingLoading || !userFeedback.trim()}
                  >
                    {ratingLoading ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Lecturer Form Interface
        <div className="content-wrapper">
          <div className="form-header">
            <div className="header-content">
              <div className="user-info-header">
                <div className="user-avatar">{currentUser?.name?.charAt(0) || 'U'}</div>
                <div className="user-details">
                  <div className="user-name">{currentUser?.name}</div>
                  <div className="user-role">{currentUser?.role}</div>
                </div>
              </div>
              <div className="header-text">
                <h2>Lecture Report Form</h2>
                <p>Complete the following steps to submit your lecture report</p>
              </div>
            </div>
            
            <div className="form-progress">
              <div className="progress-steps">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className={`progress-step ${stepNum === step ? 'active' : stepNum < step ? 'completed' : ''}`}>
                    <div className="step-number">{stepNum}</div>
                    <div className="step-label">
                      {stepNum === 1 && 'Basic Info'}
                      {stepNum === 2 && 'Details'}
                      {stepNum === 3 && 'Outcomes'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="styled-form">
            {step === 1 && (
              <div className="form-step">
                <div className="step-header">
                  <h3>Basic Information</h3>
                  <p>Select the class and course for this lecture</p>
                </div>

                {dataLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading classes and courses...</p>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Class *</label>
                      <select
                        name="class_id"
                        value={form.class_id}
                        onChange={handleChange}
                        required
                        className="form-input"
                        disabled={classes.length === 0}
                      >
                        <option value="">Select a class</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.class_name} - {c.venue} ({c.total_registered_students} students)
                          </option>
                        ))}
                      </select>
                      {classes.length === 0 && !dataLoading && (
                        <div className="input-helper error">
                          No classes available in the system.
                        </div>
                      )}
                      {selectedClass && (
                        <div className="selection-details">
                          <div className="detail-item">
                            <strong>Venue:</strong> {selectedClass.venue}
                          </div>
                          <div className="detail-item">
                            <strong>Students:</strong> {selectedClass.total_registered_students}
                          </div>
                          <div className="detail-item">
                            <strong>Schedule:</strong> {selectedClass.scheduled_time}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Course *</label>
                      <select
                        name="course_id"
                        value={form.course_id}
                        onChange={handleChange}
                        required
                        className="form-input"
                        disabled={courses.length === 0}
                      >
                        <option value="">Select a course</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.course_code} - {c.course_name}
                          </option>
                        ))}
                      </select>
                      {courses.length === 0 && !dataLoading && (
                        <div className="input-helper error">
                          No courses available in the system.
                        </div>
                      )}
                      {selectedCourse && (
                        <div className="selection-details">
                          <div className="detail-item">
                            <strong>Course Code:</strong> {selectedCourse.course_code}
                          </div>
                          <div className="detail-item">
                            <strong>Course Name:</strong> {selectedCourse.course_name}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date of Lecture *</label>
                      <input
                        type="date"
                        name="date_of_lecture"
                        value={form.date_of_lecture}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lecturer's Name</label>
                      <input
                        type="text"
                        value={currentUser?.name || ''}
                        readOnly
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="step-header">
                  <h3>Lecture Details</h3>
                  <p>Provide attendance and scheduling information</p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Week of Reporting *</label>
                    <select
                      name="week_of_reporting"
                      value={form.week_of_reporting}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Week</option>
                      {Array.from({length: 15}, (_, i) => i + 1).map(week => (
                        <option key={week} value={`Week ${week}`}>Week {week}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Students Present *</label>
                    <input
                      type="number"
                      name="actual_students_present"
                      value={form.actual_students_present}
                      onChange={handleChange}
                      placeholder="Number of students present"
                      required
                      className="form-input"
                      min="0"
                      max={selectedClass ? selectedClass.total_registered_students : 100}
                    />
                    {selectedClass && (
                      <div className="input-helper">
                        Total registered: {selectedClass.total_registered_students} students
                      </div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Topic Taught *</label>
                    <input
                      type="text"
                      name="topic_taught"
                      value={form.topic_taught}
                      onChange={handleChange}
                      placeholder="Enter the main topic covered in this lecture"
                      required
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <div className="step-header">
                  <h3>Content & Learning Outcomes</h3>
                  <p>Describe what was taught and the outcomes achieved</p>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Learning Outcomes *</label>
                    <textarea
                      name="learning_outcomes"
                      value={form.learning_outcomes}
                      onChange={handleChange}
                      placeholder="Describe the key learning outcomes and what students should be able to do after this lecture..."
                      rows="5"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Recommendations & Notes</label>
                    <textarea
                      name="recommendations"
                      value={form.recommendations}
                      onChange={handleChange}
                      placeholder="Any recommendations for improvement, follow-up activities, or important notes..."
                      rows="4"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-summary">
                  <h4>Lecture Summary</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Class:</span>
                      <span className="summary-value">
                        {selectedClass ? selectedClass.class_name : 'Not selected'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Course:</span>
                      <span className="summary-value">
                        {selectedCourse ? `${selectedCourse.course_code} - ${selectedCourse.course_name}` : 'Not selected'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Date:</span>
                      <span className="summary-value">{form.date_of_lecture || 'Not set'}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Attendance:</span>
                      <span className="summary-value">
                        {form.actual_students_present || 0} / {selectedClass ? selectedClass.total_registered_students : '?'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Week:</span>
                      <span className="summary-value">{form.week_of_reporting || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="btn btn-secondary">
                  Previous
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-next"
                  disabled={dataLoading || classes.length === 0 || courses.length === 0}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={loading || dataLoading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Lecture Report'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #0f0f0f;
          padding: 0;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        /* Header Styles */
        .form-header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          border: 1px solid #333;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .header-content {
          display: flex;
          justify-content: between;
          align-items: flex-start;
          gap: 30px;
          margin-bottom: 25px;
        }

        .user-info-header {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 200px;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          border: 2px solid #333;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: white;
          font-size: 1.1rem;
          margin-bottom: 4px;
        }

        .user-role {
          color: #b0b0b0;
          font-size: 0.9rem;
          text-transform: capitalize;
        }

        .header-text {
          flex: 1;
        }

        .header-text h2 {
          color: white;
          margin: 0 0 8px 0;
          font-size: 2.2rem;
          font-weight: 700;
        }

        .header-text p {
          color: #b0b0b0;
          margin: 0;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        /* Progress Steps - Matching Card Colors */
        .form-progress {
          margin-top: 20px;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          max-width: 500px;
          margin: 0 auto;
        }

        .progress-steps::before {
          content: '';
          position: absolute;
          top: 25px;
          left: 50px;
          right: 50px;
          height: 3px;
          background: #333;
          z-index: 1;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          flex: 1;
        }

        .step-number {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #333;
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 10px;
          transition: all 0.3s ease;
          border: 3px solid transparent;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          border-color: #444;
        }

        .progress-step.completed .step-number {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #10b981;
          border-color: #10b981;
        }

        .step-label {
          color: #888;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .progress-step.active .step-label {
          color: white;
        }

        /* Form Steps */
        .form-step {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 20px;
          border: 1px solid #333;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .step-header {
          margin-bottom: 25px;
        }

        .step-header h3 {
          color: white;
          margin: 0 0 8px 0;
          font-size: 1.6rem;
          font-weight: 600;
        }

        .step-header p {
          color: #b0b0b0;
          margin: 0;
          font-size: 1rem;
        }

        /* Form Grid */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: block;
          color: white;
          margin-bottom: 10px;
          font-weight: 600;
          font-size: 1rem;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #444;
          border-radius: 8px;
          background: #1a1a1a;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
          background: #1f1f1f;
        }

        .form-input::placeholder {
          color: #666;
        }

        .form-input:disabled {
          background: #2a2a2a;
          color: #666;
          cursor: not-allowed;
          border-color: #555;
        }

        /* Student Rating Interface */
        .section-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .section-header h3 {
          color: white;
          margin: 0 0 8px 0;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .section-header p {
          color: #b0b0b0;
          margin: 0;
          font-size: 1.1rem;
        }

        .lectures-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .lecture-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          padding: 25px;
          border: 1px solid #333;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .lecture-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          border-color: #444;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .card-header h4 {
          color: white;
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          line-height: 1.3;
          flex: 1;
        }

        .lecture-date {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid #444;
        }

        .lecture-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .detail-label {
          color: #b0b0b0;
          font-weight: 500;
          min-width: 70px;
          font-size: 0.9rem;
        }

        .detail-value {
          color: white;
          flex: 1;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .rating-section {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #333;
        }

        .rating-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .rating-header label {
          color: white;
          font-weight: 600;
          font-size: 1rem;
          margin: 0;
        }

        .current-rating {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #444;
        }

        .stars-container {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .star {
          background: none;
          border: none;
          font-size: 2rem;
          color: #555;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
        }

        .star.filled {
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        }

        .star:hover {
          color: #ffed4a;
          transform: scale(1.1);
        }

        .card-actions {
          margin-top: auto;
        }

        /* Buttons - Updated Styles */
        .btn {
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Next Button - Black with Transparent Edges */
        .btn-next {
          background: #000000;
          color: white;
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .btn-next::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid transparent;
          border-radius: 8px;
          background: linear-gradient(135deg, transparent 0%, transparent 100%);
          mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
        }

        .btn-next:hover:not(:disabled) {
          background: #1a1a1a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }

        /* Submit Button */
        .btn-submit {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: white;
          border: 2px solid #444;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          border-color: #666;
        }

        /* Other Buttons */
        .btn-primary {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: white;
          border: 2px solid #444;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          border-color: #666;
        }

        .btn-secondary {
          background: #333;
          color: white;
          border: 2px solid #555;
        }

        .btn-secondary:hover {
          background: #444;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          border: 2px solid #444;
          color: #b0b0b0;
        }

        .btn-outline:hover {
          background: #2a2a2a;
          color: white;
          transform: translateY(-1px);
        }

        .full-width {
          width: 100%;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 40px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          border: 1px solid #333;
          margin: 20px 0;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h4 {
          color: white;
          margin: 0 0 12px 0;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: #b0b0b0;
          margin: 0;
          font-size: 1.1rem;
        }

        /* Messages */
        .message {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          font-weight: 600;
          font-size: 1rem;
          text-align: center;
        }

        .message.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid #059669;
        }

        .message.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid #dc2626;
        }

        /* Modal */
        .feedback-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          padding: 30px;
          width: 100%;
          max-width: 500px;
          border: 1px solid #333;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: #b0b0b0;
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #333;
          color: white;
        }

        .modal-body {
          margin-bottom: 25px;
        }

        .lecture-info-modal p {
          color: #b0b0b0;
          margin: 8px 0;
          font-size: 0.95rem;
        }

        .lecture-info-modal strong {
          color: white;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        /* Helper Classes */
        .input-helper {
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .input-helper.info {
          color: #b0b0b0;
        }

        .input-helper.error {
          color: #ef4444;
        }

        .selection-details {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 15px;
          margin-top: 12px;
          border-left: 4px solid #444;
        }

        .detail-item {
          color: #b0b0b0;
          margin: 6px 0;
          font-size: 0.9rem;
        }

        .detail-item strong {
          color: white;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #b0b0b0;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #333;
          border-top: 4px solid #b0b0b0;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .loading-spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Form Summary */
        .form-summary {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 25px;
          margin-top: 25px;
          border: 1px solid #333;
        }

        .form-summary h4 {
          color: white;
          margin: 0 0 20px 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #333;
        }

        .summary-label {
          color: #b0b0b0;
          font-weight: 500;
        }

        .summary-value {
          color: white;
          font-weight: 600;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding-top: 25px;
          border-top: 1px solid #333;
        }

        .ml-auto {
          margin-left: auto;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content-wrapper {
            padding: 15px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .lectures-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .user-info-header {
            justify-content: center;
          }

          .progress-steps {
            flex-direction: column;
            gap: 20px;
            align-items: center;
          }

          .progress-steps::before {
            display: none;
          }

          .modal-actions {
            flex-direction: column;
          }

          .header-text h2 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}