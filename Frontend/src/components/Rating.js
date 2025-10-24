import React, { useState, useEffect, useCallback } from "react";
import { fetchLectures, postRating, getRating, getFeedback, postFeedback, getCoursesByProgramLeader, getClasses, getLecturesByClass, getUserRating } from "../api";

export default function Rating({ user, onNavigate }) {
  const [lectures, setLectures] = useState([]);
  const [ratings, setRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState(user.role === "student" ? "rate" : "feedback");
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [userFeedback, setUserFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalRated: 0,
    averageRating: 0,
    feedbackCount: 0
  });

  const loadLecturesAndRatings = useCallback(async () => {
    try {
      setLoading(true);
      
      let lecturesData = await fetchLectures();
      
      if (user.role === "student") {
        // Students see all lectures from their classes
        const classesData = await getClasses();
        let allLectures = [];
        
        for (const cls of classesData) {
          try {
            const classLectures = await getLecturesByClass(cls.id);
            allLectures = [...allLectures, ...classLectures];
          } catch (error) {
            console.error(`Error fetching lectures for class ${cls.id}:`, error);
          }
        }
        
        // Allow rating of all lectures from student's classes, including current ones
        lecturesData = allLectures;
        
      } else if (user.role === "lecturer") {
        // Lecturers see only their own lectures
        lecturesData = lecturesData.filter(lecture => lecture.lecturer_id === user.id);
      } else if (user.role === "program_leader" || user.role === "principal_lecturer" || user.role === "admin") {
        // Program leaders, principal lecturers, and admins see ALL lectures (same view)
        // No filtering needed - they see everything
        lecturesData = await fetchLectures();
      }

      setLectures(lecturesData);

      // Load ratings for all lectures
      const ratingPromises = lecturesData.map(lecture => getRating(lecture.id));
      const ratingResults = await Promise.all(ratingPromises);

      // Load user's ratings for lectures (only for students)
      let userRatingResults = [];
      if (user.role === "student") {
        const userRatingPromises = lecturesData.map(lecture => getUserRating(lecture.id));
        userRatingResults = await Promise.all(userRatingPromises);
      }

      const ratingsMap = {};
      const userRatingsMap = {};
      let totalRated = 0;
      let totalRating = 0;

      lecturesData.forEach((lecture, index) => {
        ratingsMap[lecture.id] = ratingResults[index];
        if (user.role === "student") {
          userRatingsMap[lecture.id] = userRatingResults[index];
        }
        if (ratingResults[index] && ratingResults[index].average_rating) {
          totalRated++;
          totalRating += parseFloat(ratingResults[index].average_rating);
        }
      });
      setRatings(ratingsMap);
      setUserRatings(userRatingsMap);

      // Load feedback for all lectures
      const feedbackPromises = lecturesData.map(lecture => getFeedback(lecture.id));
      const feedbackResults = await Promise.all(feedbackPromises);

      const feedbacksMap = {};
      let feedbackCount = 0;

      lecturesData.forEach((lecture, index) => {
        feedbacksMap[lecture.id] = feedbackResults[index] || [];
        if (feedbackResults[index] && feedbackResults[index].length > 0) {
          feedbackCount += feedbackResults[index].length;
        }
      });
      setFeedbacks(feedbacksMap);

      // Calculate stats
      setStats({
        totalRated,
        averageRating: totalRated > 0 ? (totalRating / totalRated).toFixed(1) : 0,
        feedbackCount
      });

    } catch (error) {
      console.error("Failed to load data:", error);
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    loadLecturesAndRatings();
  }, [loadLecturesAndRatings]);

  const handleRateLecture = async (lectureId, rating) => {
    // Only students can rate
    if (user.role !== "student") {
      setMessage("Only students can rate lectures");
      return;
    }

    try {
      setSubmitting(true);
      await postRating({ lecture_id: lectureId, rating });
      
      // Update the local ratings state
      const updatedRating = await getRating(lectureId);
      const updatedUserRating = await getUserRating(lectureId);
      
      setRatings(prev => ({
        ...prev,
        [lectureId]: updatedRating
      }));
      
      setUserRatings(prev => ({
        ...prev,
        [lectureId]: updatedUserRating
      }));
      
      setMessage("Lecture rating submitted successfully!");
      setTimeout(() => setMessage(""), 3000);
      
      // Update stats
      loadLecturesAndRatings();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedLecture || !userFeedback.trim()) return;

    try {
      setSubmitting(true);
      await postFeedback({
        lecture_id: selectedLecture.id,
        feedback_text: userFeedback
      });

      // Reload feedback for this lecture
      const updatedFeedback = await getFeedback(selectedLecture.id);
      setFeedbacks(prev => ({
        ...prev,
        [selectedLecture.id]: updatedFeedback
      }));

      setMessage("Feedback submitted successfully!");
      setUserFeedback("");
      setSelectedLecture(null);
      setTimeout(() => setMessage(""), 3000);
      
      // Update stats
      loadLecturesAndRatings();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingStats = (lectureId) => {
    const rating = ratings[lectureId];
    if (!rating || !rating.average_rating) {
      return { average: 0, count: 0, percentage: 0 };
    }
    
    const average = parseFloat(rating.average_rating);
    const count = rating.total_ratings || 0;
    const percentage = (average / 5) * 100;
    
    return { average, count, percentage };
  };

  const getUserRatingValue = (lectureId) => {
    return userRatings[lectureId] || 0;
  };

  const renderStars = (rating, interactive = false, onRate = null, size = "medium", userRating = 0) => {
    const starSize = {
      small: "1.2rem",
      medium: "1.5rem",
      large: "2rem"
    }[size];

    // If interactive and user has already rated, show their rating
    const displayRating = interactive && userRating > 0 ? userRating : rating;

    return (
      <div className={`stars-container ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`star ${star <= displayRating ? 'filled' : ''} ${size}`}
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive || submitting || user.role !== "student"}
            style={{ fontSize: starSize }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.0) return "Good";
    if (rating >= 2.0) return "Fair";
    if (rating > 0) return "Poor";
    return "Not Rated";
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.0) return "rating-excellent";
    if (rating >= 3.0) return "rating-good";
    if (rating > 0) return "rating-fair";
    return "rating-poor";
  };

  // Safe navigation handler
  const handleNavigation = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    } else {
      console.warn('onNavigate function not available');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading lectures and ratings...</p>
      </div>
    );
  }

  return (
    <div className="rating-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => handleNavigation('Dashboard')}>
          Home
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Ratings & Feedback</span>
      </div>

      <div className="quick-navigation">
        <h4>Quick Navigation</h4>
        <div className="nav-buttons">
          <button onClick={() => handleNavigation('Dashboard')}>Dashboard</button>
          <button onClick={() => handleNavigation('Lectures')}>Lectures</button>
          {user.role === "lecturer" && (
            <button onClick={() => handleNavigation('Create Lecture')}>Create Lecture</button>
          )}
          <button onClick={() => handleNavigation('Lecture Classes')}>All Classes</button>
          <button onClick={() => handleNavigation('Monitoring')}>Monitoring</button>
        </div>
      </div>

      <div className="rating-content">
        <header className="rating-header">
          <div className="header-text">
            <h1>Lecture Ratings & Feedback</h1>
            <p>
              {user.role === "student"
                ? "Rate your lectures and view feedback from lecturers"
                : "View lecture ratings and provide feedback to students"
              }
            </p>
          </div>
          <div className="rating-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalRated}</div>
              <div className="stat-label">Lectures Rated</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.averageRating}/5</div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.feedbackCount}</div>
              <div className="stat-label">Feedback Given</div>
            </div>
          </div>
        </header>

        {message && (
          <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {user.role === "student" && (
            <>
              <button
                className={`tab ${activeTab === "rate" ? "active" : ""}`}
                onClick={() => setActiveTab("rate")}
              >
                Rate Lectures
              </button>
              <button
                className={`tab ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => setActiveTab("reviews")}
              >
                View Feedback
              </button>
            </>
          )}
          {user.role !== "student" && (
            <>
              <button
                className={`tab ${activeTab === "myratings" ? "active" : ""}`}
                onClick={() => setActiveTab("myratings")}
              >
                {user.role === "program_leader" || user.role === "principal_lecturer" || user.role === "admin" 
                  ? "All Lecture Ratings" 
                  : "My Lecture Ratings"
                }
              </button>
              <button
                className={`tab ${activeTab === "feedback" ? "active" : ""}`}
                onClick={() => setActiveTab("feedback")}
              >
                Give Feedback
              </button>
            </>
          )}
        </div>

        {/* Rate Lectures Tab (For Students Only) */}
        {activeTab === "rate" && user.role === "student" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Rate Your Lectures</h2>
              <p>Click on the stars to rate each lecture from 1 (Poor) to 5 (Excellent)</p>
            </div>
            
            <div className="lectures-grid">
              {lectures.map(lecture => {
                const stats = getRatingStats(lecture.id);
                const userRating = getUserRatingValue(lecture.id);
                const lectureFeedbacks = feedbacks[lecture.id] || [];

                return (
                  <div key={lecture.id} className="lecture-card rating-card">
                    <div className="card-header">
                      <div className="lecture-info">
                        <h3>{lecture.course_name}</h3>
                        <span className="course-code">{lecture.course_code}</span>
                      </div>
                      <div className="lecture-meta">
                        <span className="date">{new Date(lecture.date_of_lecture).toLocaleDateString()}</span>
                        <span className="lecturer">By {lecture.lecturer_name}</span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="topic-section">
                        <strong>Topic:</strong> {lecture.topic_taught}
                      </div>

                      <div className="class-info">
                        <strong>Class:</strong> {lecture.class_name} • {lecture.venue}
                      </div>

                      <div className="rating-display">
                        <div className="current-rating">
                          <div className="rating-score">
                            <span className={`score ${getRatingColor(stats.average)}`}>
                              {stats.average.toFixed(1)}
                            </span>
                            <span className="out-of">/5</span>
                          </div>
                          <div className="rating-text">{getRatingText(stats.average)}</div>
                          <div className="rating-count">{stats.count} ratings</div>
                        </div>

                        <div className="rating-stars">
                          {renderStars(stats.average, false, null, "medium")}
                        </div>
                      </div>

                      <div className="progress-section">
                        <div className="progress-label">Overall Rating</div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <div className="rate-section">
                        <label>Your Rating: {userRating > 0 ? `(${userRating}/5)` : ''}</label>
                        {renderStars(0, true, (rating) => handleRateLecture(lecture.id, rating), "large", userRating)}
                      </div>
                      <div className="feedback-indicator">
                        <strong>Lecturer Feedback:</strong> {lectureFeedbacks.length} comments
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {lectures.length === 0 && (
              <div className="no-lectures">
                <h3>No Lectures Available for Rating</h3>
                <p>There are no past lectures available for rating at the moment. Lectures must be completed before students can rate them. Please check back after attending your lectures.</p>
              </div>
            )}
          </div>
        )}

        {/* View Feedback Tab (For Students) */}
        {activeTab === "reviews" && user.role === "student" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Feedback from Lecturers</h2>
              <p>Read feedback provided by your lecturers</p>
            </div>

            <div className="feedback-container">
              {lectures.map(lecture => {
                const lectureFeedbacks = feedbacks[lecture.id] || [];
                
                if (lectureFeedbacks.length === 0) return null;

                return (
                  <div key={lecture.id} className="feedback-lecture-card">
                    <div className="feedback-lecture-header">
                      <h3>{lecture.course_name} ({lecture.course_code})</h3>
                      <p>
                        By {lecture.lecturer_name} • {new Date(lecture.date_of_lecture).toLocaleDateString()}
                      </p>
                      <p><strong>Topic:</strong> {lecture.topic_taught}</p>
                    </div>

                    <div className="feedback-list">
                      {lectureFeedbacks.map((feedback, index) => (
                        <div key={index} className="feedback-item student-feedback">
                          <div className="feedback-header">
                            <span className="feedback-author">
                              {feedback.user_name || 'Lecturer'}
                            </span>
                            <span className="feedback-date">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="feedback-text">
                            {feedback.feedback_text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {lectures.every(lecture => feedbacks[lecture.id]?.length === 0) && (
                <div className="no-feedback">
                  <h3>No Feedback Yet</h3>
                  <p>Your lecturers haven't provided any feedback yet. Check back later!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Lecture Ratings Tab (For Program Leaders, Principal Lecturers, and Admins) */}
        {activeTab === "myratings" && user.role !== "student" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>
                {user.role === "program_leader" || user.role === "principal_lecturer" || user.role === "admin" 
                  ? "All Lecture Ratings" 
                  : "My Lecture Ratings"
                }
              </h2>
              <p>
                {user.role === "program_leader" || user.role === "principal_lecturer" || user.role === "admin" 
                  ? "View ratings and feedback for all lectures across the institution" 
                  : "View ratings and feedback for your lectures"
                }
              </p>
            </div>

            <div className="lectures-grid">
              {lectures.map(lecture => {
                const stats = getRatingStats(lecture.id);
                const lectureFeedbacks = feedbacks[lecture.id] || [];

                return (
                  <div key={lecture.id} className="lecture-card rating-card">
                    <div className="card-header">
                      <div className="lecture-info">
                        <h3>{lecture.course_name}</h3>
                        <span className="course-code">{lecture.course_code}</span>
                      </div>
                      <div className="lecture-meta">
                        <span className="date">{new Date(lecture.date_of_lecture).toLocaleDateString()}</span>
                        <span className="class-name">{lecture.class_name}</span>
                        <span className="lecturer">By {lecture.lecturer_name}</span>
                        {lecture.faculty_name && (
                          <span className="faculty">Faculty: {lecture.faculty_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="topic-section">
                        <strong>Topic:</strong> {lecture.topic_taught}
                      </div>

                      <div className="rating-display">
                        <div className="current-rating">
                          <div className="rating-score">
                            <span className={`score ${getRatingColor(stats.average)}`}>
                              {stats.average.toFixed(1)}
                            </span>
                            <span className="out-of">/5</span>
                          </div>
                          <div className="rating-text">{getRatingText(stats.average)}</div>
                          <div className="rating-count">{stats.count} student ratings</div>
                        </div>

                        <div className="rating-stars">
                          {renderStars(stats.average, false, null, "medium")}
                        </div>
                      </div>

                      <div className="progress-section">
                        <div className="progress-label">Overall Rating</div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <div className="feedback-summary">
                        <strong>Feedback:</strong> {lectureFeedbacks.length} comments given
                      </div>
                      {(user.role === "lecturer" && lecture.lecturer_id === user.id) || 
                       user.role === "admin" || 
                       user.role === "program_leader" || 
                       user.role === "principal_lecturer" ? (
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedLecture(lecture);
                            setActiveTab("feedback");
                          }}
                        >
                          {lectureFeedbacks.length > 0 ? 'Update Feedback' : 'Add Feedback'}
                        </button>
                      ) : (
                        <button className="btn btn-outline" disabled>
                          View Only
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {lectures.length === 0 && (
              <div className="no-lectures">
                <h3>No Lectures Found</h3>
                <p>
                  {user.role === "program_leader" || user.role === "principal_lecturer" || user.role === "admin" 
                    ? "There are no lectures in the system at the moment." 
                    : "You have no lectures assigned at the moment."
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Give Feedback Tab (For Lecturers, Program Leaders, Principal Lecturers, and Admins) */}
        {activeTab === "feedback" && user.role !== "student" && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Provide Feedback to Students</h2>
              <p>Share your thoughts and suggestions to help students improve</p>
            </div>
            
            {selectedLecture ? (
              <div className="feedback-form-container">
                <div className="selected-item">
                  <h3>{selectedLecture.course_name} ({selectedLecture.course_code})</h3>
                  <p>
                    Class: {selectedLecture.class_name} • {new Date(selectedLecture.date_of_lecture).toLocaleDateString()}
                  </p>
                  <p><strong>Topic:</strong> {selectedLecture.topic_taught}</p>
                  <p><strong>Lecturer:</strong> {selectedLecture.lecturer_name}</p>
                  <div className="lecture-rating">
                    <strong>Current Rating:</strong> {getRatingStats(selectedLecture.id).average.toFixed(1)}/5 
                    ({getRatingStats(selectedLecture.id).count} student ratings)
                  </div>
                </div>
                
                <form onSubmit={handleSubmitFeedback} className="feedback-form">
                  <div className="form-group">
                    <label className="form-label">Your Feedback for Students</label>
                    <textarea
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                      placeholder="Provide constructive feedback to help students improve. What did they do well? What can they work on?"
                      rows="6"
                      className="form-input"
                      required
                    />
                    <div className="input-helper">
                      Your feedback will be visible to students in this lecture
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLecture(null);
                        setUserFeedback("");
                      }}
                      className="btn btn-secondary"
                    >
                      Back to Lectures
                    </button>
                    <button
                      type="submit"
                      disabled={!userFeedback.trim() || submitting}
                      className="btn btn-primary"
                    >
                      {submitting ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback to Students'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="select-item-prompt">
                <h3>Select a Lecture</h3>
                <p>
                  {user.role === "program_leader" || user.role === "principal_lecturer" || user.role === "admin" 
                    ? "Choose a lecture from the 'All Lecture Ratings' tab to provide feedback to students" 
                    : "Choose a lecture from the 'My Lecture Ratings' tab to provide feedback to students"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}