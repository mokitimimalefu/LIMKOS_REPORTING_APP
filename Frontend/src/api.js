
// api.js

const BASE_URL = "http://localhost:8081";

// ======= Helper function for fetch requests =======
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    
    // Handle empty responses
    if (res.status === 204) {
      return { success: true };
    }
    
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ======= AUTH =======
export async function registerUser(userData) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(userData) });
}

export async function loginUser(credentials) {
  const data = await request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// ======= USERS =======
export async function getUsers() { 
  try {
    const response = await request("/users");
    return response || [];
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getUserById(id) { 
  try {
    return request(`/users/${id}`);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

export async function getUsersByRole(role) { 
  try {
    const users = await getUsers();
    if (role === 'all') {
      return users;
    }
    return users.filter(user => user.role === role);
  } catch (error) {
    console.error(`Error fetching users by role ${role}:`, error);
    return [];
  }
}

// ======= CLASSES =======
export async function getClasses() { 
  try {
    const classes = await request("/classes");
    return Array.isArray(classes) ? classes : [];
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
}

export async function getClassById(id) { 
  try {
    return request(`/classes/${id}`);
  } catch (error) {
    console.error("Error fetching class by ID:", error);
    return null;
  }
}

export async function postClass(data) { 
  const result = await request("/classes", { method: "POST", body: JSON.stringify(data) });
  return result.class || result;
}

export async function updateClass(id, data) { 
  const result = await request(`/classes/${id}`, { method: "PUT", body: JSON.stringify(data) });
  return result.class || result;
}

export async function deleteClass(id) { 
  return request(`/classes/${id}`, { method: "DELETE" });
}

export async function getClassesByFaculty(facultyId) { 
  try {
    const classes = await getClasses();
    return classes.filter(cls => cls.faculty_id === parseInt(facultyId));
  } catch (error) {
    console.error("Error fetching classes by faculty:", error);
    return [];
  }
}

// ======= FACULTIES =======
export async function getFacultyById(id) { 
  try {
    return request(`/faculties/${id}`);
  } catch (error) {
    console.error("Error fetching faculty by ID:", error);
    return null;
  }
}

export async function getAllFaculties() { 
  try {
    const faculties = await request("/faculties");
    // Ensure we return an array even if the response is not as expected
    if (Array.isArray(faculties)) {
      return faculties;
    } else if (faculties && Array.isArray(faculties.data)) {
      return faculties.data;
    } else {
      console.warn("Unexpected faculties response format:", faculties);
      return [];
    }
  } catch (error) {
    console.error("Error fetching faculties:", error);
    return [];
  }
}

// ======= LECTURER ASSIGNMENTS =======
export async function getLecturerAssignments(lecturerId = null) { 
  try {
    const endpoint = lecturerId ? `/lecturer-assignments?lecturer_id=${lecturerId}` : '/lecturer-assignments';
    const assignments = await request(endpoint);
    return Array.isArray(assignments) ? assignments : [];
  } catch (error) {
    console.error("Error fetching lecturer assignments:", error);
    return [];
  }
}

export async function assignLecturer(data) { 
  return request("/lecturer-assignments", { method: "POST", body: JSON.stringify(data) });
}

export async function getAssignmentsByLecturer(lecturerId) { 
  try {
    return await getLecturerAssignments(lecturerId);
  } catch (error) {
    console.error("Error fetching assignments by lecturer:", error);
    return [];
  }
}

// ======= LECTURES =======
export async function fetchLectures() { 
  try {
    const lectures = await request("/lectures");
    return Array.isArray(lectures) ? lectures : [];
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return [];
  }
}

export async function getLectureById(id) { 
  try {
    return request(`/lectures/${id}`);
  } catch (error) {
    console.error("Error fetching lecture by ID:", error);
    return null;
  }
}

export async function postLecture(data) { 
  return request("/lectures", { method: "POST", body: JSON.stringify(data) });
}

export async function updateLecture(id, data) { 
  return request(`/lectures/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteLecture(id) { 
  return request(`/lectures/${id}`, { method: "DELETE" });
}

export async function getLecturesByLecturer(lecturerId) { 
  try {
    const lectures = await fetchLectures();
    return lectures.filter(lecture => lecture.lecturer_id === parseInt(lecturerId));
  } catch (error) {
    console.error("Error fetching lectures by lecturer:", error);
    return [];
  }
}

export async function getLecturesByClass(classId) { 
  try {
    // Use the dedicated endpoint for class lectures
    const lectures = await request(`/classes/${classId}/lectures`);
    return Array.isArray(lectures) ? lectures : [];
  } catch (error) {
    console.error("Error fetching lectures by class:", error);
    return [];
  }
}

// ======= COURSES =======
export async function getCourses() { 
  try {
    const courses = await request("/courses");
    return Array.isArray(courses) ? courses : [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export async function getCourseById(id) { 
  try {
    return request(`/courses/${id}`);
  } catch (error) {
    console.error("Error fetching course by ID:", error);
    return null;
  }
}

export async function postCourse(data) { 
  const result = await request("/courses", { method: "POST", body: JSON.stringify(data) });
  return result.course || result;
}

export async function updateCourse(id, data) { 
  const result = await request(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) });
  return result.course || result;
}

export async function deleteCourse(id) { 
  return request(`/courses/${id}`, { method: "DELETE" });
}

export async function getCoursesByProgramLeader(programLeaderId) { 
  try {
    const courses = await getCourses();
    return courses.filter(course => course.program_leader_id === parseInt(programLeaderId));
  } catch (error) {
    console.error("Error fetching courses by program leader:", error);
    return [];
  }
}

// api.js - Add these functions for lecture reports

// ======= LECTURE REPORT SPECIFIC FUNCTIONS =======
export async function getLecturesByDateRange(startDate, endDate, lecturerId = null) {
  try {
    const lectures = await fetchLectures();
    
    const filteredLectures = lectures.filter(lecture => {
      const lectureDate = lecture.date_of_lecture;
      return lectureDate >= startDate && lectureDate <= endDate;
    });

    if (lecturerId) {
      return filteredLectures.filter(lecture => lecture.lecturer_id === parseInt(lecturerId));
    }
    
    return filteredLectures;
  } catch (error) {
    console.error("Error fetching lectures by date range:", error);
    return [];
  }
}

export async function getLecturerReportStats(lecturerId, startDate, endDate) {
  try {
    const lectures = await getLecturesByDateRange(startDate, endDate, lecturerId);
    const classes = await getClasses();
    
    // Create class mapping for easier lookup
    const classMap = {};
    classes.forEach(cls => {
      classMap[cls.id] = cls;
    });

    // Enhance lectures with class data
    const enhancedLectures = lectures.map(lecture => ({
      ...lecture,
      class_data: classMap[lecture.class_id] || {}
    }));

    return {
      totalLectures: enhancedLectures.length,
      lectures: enhancedLectures
    };
  } catch (error) {
    console.error("Error fetching lecturer stats:", error);
    return { totalLectures: 0, lectures: [] };
  }
}

// Enhanced rating function for reports
export async function getRatingDataForReports(lectureIds) {
  try {
    const ratingPromises = lectureIds.map(id => getRating(id));
    const ratings = await Promise.all(ratingPromises);
    
    return ratings.filter(rating => rating && rating.average_rating);
  } catch (error) {
    console.error("Error fetching rating data for reports:", error);
    return [];
  }
}

// Enhanced feedback function for reports
export async function getFeedbackDataForReports(lectureIds) {
  try {
    const feedbackPromises = lectureIds.map(id => getFeedback(id));
    const feedbackResults = await Promise.all(feedbackPromises);
    
    return feedbackResults.flat().filter(fb => fb && fb.feedback_text);
  } catch (error) {
    console.error("Error fetching feedback data for reports:", error);
    return [];
  }
}

// ======= RATINGS =======
export async function postRating(data) { 
  return request("/rating", { method: "POST", body: JSON.stringify(data) });
}

export async function getRating(lectureId) { 
  try {
    return await request(`/rating/${lectureId}`);
  } catch (error) {
    console.error("Error fetching rating:", error);
    return { average_rating: null, total_ratings: 0 };
  }
}

export async function getUserRating(lectureId) { 
  try {
    const response = await request(`/rating/${lectureId}/user`);
    return response.user_rating || null;
  } catch (error) {
    console.error("Error fetching user rating:", error);
    return null;
  }
}

export async function getRatingsByLecturer(lecturerId) { 
  try {
    const lectures = await getLecturesByLecturer(lecturerId);
    const ratings = [];
    
    for (const lecture of lectures) {
      try {
        const rating = await getRating(lecture.id);
        if (rating && rating.average_rating) {
          ratings.push({
            ...rating,
            lecture_id: lecture.id,
            lecture_title: lecture.topic_taught,
            class_name: lecture.class_name
          });
        }
      } catch (error) {
        continue;
      }
    }
    
    return ratings;
  } catch (error) {
    console.error("Error fetching ratings by lecturer:", error);
    return [];
  }
}

// ======= FEEDBACK =======
export async function postFeedback(data) { 
  return request("/feedback", { method: "POST", body: JSON.stringify(data) });
}

export async function getFeedback(lectureId) { 
  try {
    const feedback = await request(`/feedback/${lectureId}`);
    return Array.isArray(feedback) ? feedback : [];
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return [];
  }
}

export async function getFeedbackByLecturer(lecturerId) { 
  try {
    const lectures = await getLecturesByLecturer(lecturerId);
    const allFeedback = [];
    
    for (const lecture of lectures) {
      try {
        const feedback = await getFeedback(lecture.id);
        if (feedback && feedback.length > 0) {
          allFeedback.push(...feedback.map(fb => ({
            ...fb,
            lecture_id: lecture.id,
            lecture_title: lecture.topic_taught
          })));
        }
      } catch (error) {
        continue;
      }
    }
    
    return allFeedback;
  } catch (error) {
    console.error("Error fetching feedback by lecturer:", error);
    return [];
  }
}

// ======= REPORTS =======
export async function getProgramReports(programLeaderId) {
  return request(`/program-reports/${programLeaderId}`);
}

export async function generateProgramReport(programLeaderId, reportType, timeRange = 'current_semester') {
  return request("/program-reports/generate", { 
    method: "POST", 
    body: JSON.stringify({ 
      programLeaderId, 
      reportType,
      timeRange 
    })
  });
}

// ======= PRINCIPAL REPORTS =======
export async function getPrincipalReports(dateRange = {}, department = 'all') {
  try {
    const [lectures, classes, courses, faculties, lecturers] = await Promise.all([
      fetchLectures(),
      getClasses(),
      getCourses(),
      getAllFaculties(),
      getUsersByRole('lecturer')
    ]);

    let filteredLectures = lectures;
    if (dateRange.start && dateRange.end) {
      filteredLectures = lectures.filter(lecture => {
        const lectureDate = new Date(lecture.date_of_lecture);
        return lectureDate >= new Date(dateRange.start) && 
               lectureDate <= new Date(dateRange.end);
      });
    }

    const totalStudents = classes.reduce((sum, cls) => sum + (cls.total_registered_students || 0), 0);
    const totalLecturers = lecturers.length;
    const totalFaculties = faculties.length;
    
    const totalActualAttendance = filteredLectures.reduce((sum, lecture) => sum + (lecture.actual_students_present || 0), 0);
    const totalPossibleAttendance = filteredLectures.reduce((sum, lecture) => {
      const classData = classes.find(c => c.id === lecture.class_id);
      return sum + (classData ? classData.total_registered_students : 0);
    }, 0);
    
    const overallAttendance = totalPossibleAttendance > 0 
      ? Math.round((totalActualAttendance / totalPossibleAttendance) * 100)
      : 0;

    return {
      institutionStats: {
        totalStudents,
        totalLecturers,
        totalCourses: courses.length,
        totalFaculties,
        overallAttendance,
        completionRate: Math.round((filteredLectures.length / Math.max(lectures.length, 1)) * 100),
        averageClassSize: classes.length > 0 ? Math.round(totalStudents / classes.length) : 0,
        studentTeacherRatio: totalLecturers > 0 ? Math.round(totalStudents / totalLecturers) : 0
      },
      summary: {
        period: dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'All time',
        totalDataPoints: filteredLectures.length
      }
    };
  } catch (error) {
    console.error("Error fetching principal reports:", error);
    throw error;
  }
}

// ======= UTILITIES =======
export function exportToCSV(data, filename = "export") {
  if (!data || !data.length) {
    alert("No data to export");
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(r => headers.map(h => `"${(r[h] || "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ======= TEST CONNECTION =======
export async function testConnection() { 
  return request("/db-status");
}

// ======= CUSTOM HELPERS =======
export async function getProgramStudents(programLeaderId) {
  try {
    const students = await getUsersByRole('student');
    return students.slice(0, 10);
  } catch (error) {
    console.error("Error fetching program students:", error);
    return [];
  }
}

export async function getFacultyByProgram(programLeaderId) {
  try {
    const lecturers = await getUsersByRole('lecturer');
    return lecturers.slice(0, 5);
  } catch (error) {
    console.error("Error fetching program faculty:", error);
    return [];
  }
}

export async function getLecturesByCourseIds(courseIds) {
  try {
    const lectures = await fetchLectures();
    return lectures.filter(lecture => courseIds.includes(lecture.course_id));
  } catch (error) {
    console.error("Error fetching lectures by course IDs:", error);
    return [];
  }
}

// ======= NEW HELPER FUNCTIONS =======
export async function getFacultiesWithStats() {
  try {
    const [faculties, classes] = await Promise.all([
      getAllFaculties(),
      getClasses()
    ]);
    
    return faculties.map(faculty => {
      const facultyClasses = classes.filter(cls => cls.faculty_id === faculty.id);
      const totalStudents = facultyClasses.reduce((sum, cls) => sum + (cls.total_registered_students || 0), 0);
      
      return {
        ...faculty,
        totalClasses: facultyClasses.length,
        totalStudents,
        averageClassSize: facultyClasses.length > 0 ? Math.round(totalStudents / facultyClasses.length) : 0
      };
    });
  } catch (error) {
    console.error("Error fetching faculties with stats:", error);
    return [];
  }
}


// Health check with more details
export async function getSystemStatus() {
  try {
    const [dbStatus, users, classes, lectures, courses, faculties] = await Promise.all([
      testConnection(),
      getUsers().catch(() => []),
      getClasses().catch(() => []),
      fetchLectures().catch(() => []),
      getCourses().catch(() => []),
      getAllFaculties().catch(() => [])
    ]);
    
    return {
      database: dbStatus.status || 'Unknown',
      users: users.length,
      classes: classes.length,
      lectures: lectures.length,
      courses: courses.length,
      faculties: faculties.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting system status:", error);
    return {
      database: 'Error',
      users: 0,
      classes: 0,
      lectures: 0,
      courses: 0,
      faculties: 0,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}
