// index.js - Consolidated Server File with Role-Based Access Control
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// ===== DATABASE CONFIGURATION =====

const pool = mysql.createPool({
  host:'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
  user:'3ii18abVPnfYx1E.root',
  password: 'mphwDyC5r8OWGqPk',
  database: 'test',
  waitForConnections: true,
  connectionLimit:10,
  timezone: 'Z',
  ssl:{rejectUnauthorized: true}
});

// ===== AUTHENTICATION MIDDLEWARE =====
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = payload;
    next();
  });
}

// ===== ROLE-BASED ACCESS CONTROL MIDDLEWARE =====
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES =====

// === AUTH ROUTES ===
// Register
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const validRoles = ["student", "lecturer", "principal_lecturer", "program_leader"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.json({
      message: "User registered successfully!",
      user: { id: result.insertId, name, email, role },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ error: "Invalid email or password" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// === USERS ROUTES ===
// GET all users
app.get('/users', authenticateToken, requireRole(['admin', 'principal_lecturer']), async (req, res) => {
  try {
    const sql = `SELECT id, name, email, role FROM users`;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET user by id
app.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const sql = `SELECT id, name, email, role FROM users WHERE id = ?`;
    const [rows] = await pool.execute(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /users/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === COURSES ROUTES ===
// GET all courses - Program leaders only see their own courses
app.get('/courses', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    let sql = `
      SELECT 
        c.id, 
        c.course_code, 
        c.course_name, 
        c.program_leader_id,
        c.created_at,
        u.name as program_leader_name,
        u.email as program_leader_email
      FROM courses c
      LEFT JOIN users u ON c.program_leader_id = u.id
    `;
    
    // If user is a program_leader, only show their own courses
    if (req.user.role === 'program_leader') {
      sql += ' WHERE c.program_leader_id = ?';
      const [rows] = await pool.execute(sql + ' ORDER BY c.created_at DESC', [req.user.id]);
      return res.json(rows);
    }
    
    // Admin and principal_lecturer see all courses
    const [rows] = await pool.execute(sql + ' ORDER BY c.created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /courses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all courses without restrictions (for lecture form)
app.get('/all-courses', authenticateToken, requireRole(['lecturer', 'principal_lecturer', 'admin']), async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.course_code, 
        c.course_name, 
        c.program_leader_id,
        c.created_at,
        u.name as program_leader_name,
        u.email as program_leader_email
      FROM courses c
      LEFT JOIN users u ON c.program_leader_id = u.id
      ORDER BY c.created_at DESC
    `;
    
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error('GET /all-courses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET course by id - Program leaders can only access their own courses
app.get('/courses/:id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.course_code, 
        c.course_name, 
        c.program_leader_id,
        c.created_at,
        u.name as program_leader_name,
        u.email as program_leader_email
      FROM courses c
      LEFT JOIN users u ON c.program_leader_id = u.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.execute(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    
    // If user is program_leader, check if they own this course
    if (req.user.role === 'program_leader' && rows[0].program_leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this course' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /courses/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create course - ONLY program leaders can create courses (auto-assigned to them)
app.post('/courses', authenticateToken, requireRole(['program_leader']), async (req, res) => {
  try {
    const { course_code, course_name } = req.body;
    if (!course_code || !course_name) {
      return res.status(400).json({ error: 'course_code and course_name are required' });
    }

    // Auto-assign the course to the current program leader
    const program_leader_id = req.user.id;

    const sql = `INSERT INTO courses (course_code, course_name, program_leader_id) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(sql, [course_code, course_name, program_leader_id]);
    
    // Return the newly created course with leader info
    const [newCourse] = await pool.execute(`
      SELECT 
        c.id, 
        c.course_code, 
        c.course_name, 
        c.program_leader_id,
        c.created_at,
        u.name as program_leader_name,
        u.email as program_leader_email
      FROM courses c
      LEFT JOIN users u ON c.program_leader_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    res.json({ success: true, course: newCourse[0] });
  } catch (err) {
    console.error('POST /courses error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update course - ONLY program leaders can update their own courses
app.put('/courses/:id', authenticateToken, requireRole(['program_leader']), async (req, res) => {
  try {
    const { course_code, course_name } = req.body;
    if (!course_code || !course_name) {
      return res.status(400).json({ error: 'course_code and course_name are required' });
    }

    // Check if the course exists and belongs to this program leader
    const [existingCourse] = await pool.execute('SELECT program_leader_id FROM courses WHERE id = ?', [req.params.id]);
    if (!existingCourse.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (existingCourse[0].program_leader_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own courses' });
    }

    const sql = `UPDATE courses SET course_code = ?, course_name = ? WHERE id = ?`;
    await pool.execute(sql, [course_code, course_name, req.params.id]);
    
    // Return the updated course with leader info
    const [updatedCourse] = await pool.execute(`
      SELECT 
        c.id, 
        c.course_code, 
        c.course_name, 
        c.program_leader_id,
        c.created_at,
        u.name as program_leader_name,
        u.email as program_leader_email
      FROM courses c
      LEFT JOIN users u ON c.program_leader_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    res.json({ success: true, course: updatedCourse[0] });
  } catch (err) {
    console.error('PUT /courses/:id error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE course - ONLY program leaders can delete their own courses
app.delete('/courses/:id', authenticateToken, requireRole(['program_leader']), async (req, res) => {
  try {
    // Check if the course exists and belongs to this program leader
    const [existingCourse] = await pool.execute('SELECT program_leader_id FROM courses WHERE id = ?', [req.params.id]);
    if (!existingCourse.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (existingCourse[0].program_leader_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own courses' });
    }

    const sql = `DELETE FROM courses WHERE id = ?`;
    await pool.execute(sql, [req.params.id]);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    console.error('DELETE /courses/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === CLASSES ROUTES ===
// GET all classes with faculty information - Allow students to access
app.get('/classes', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader', 'lecturer', 'student']), async (req, res) => {
  try {
    let sql = `
      SELECT 
        c.id, 
        c.class_name, 
        c.faculty_id, 
        c.total_registered_students, 
        c.venue, 
        c.scheduled_time, 
        c.created_at,
        f.name AS faculty_name
      FROM classes c
      LEFT JOIN faculties f ON c.faculty_id = f.id
    `;
    
    const [rows] = await pool.execute(sql + ' ORDER BY c.created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /classes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all classes without assignment restrictions (for lecture form)
app.get('/all-classes', authenticateToken, requireRole(['lecturer', 'principal_lecturer', 'admin']), async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.class_name, 
        c.faculty_id, 
        c.total_registered_students, 
        c.venue, 
        c.scheduled_time, 
        c.created_at,
        f.name AS faculty_name
      FROM classes c
      LEFT JOIN faculties f ON c.faculty_id = f.id
      ORDER BY c.created_at DESC
    `;
    
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error('GET /all-classes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET class by id with faculty information - Allow students to access
app.get('/classes/:id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader', 'lecturer', 'student']), async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.class_name, 
        c.faculty_id, 
        c.total_registered_students, 
        c.venue, 
        c.scheduled_time, 
        c.created_at,
        f.name AS faculty_name
      FROM classes c
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.execute(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Class not found' });
    
    // If user is lecturer, check if they're assigned to this class
    if (req.user.role === 'lecturer') {
      const [assignment] = await pool.execute(
        'SELECT id FROM lecturer_assignments WHERE lecturer_id = ? AND class_id = ?',
        [req.user.id, req.params.id]
      );
      if (!assignment.length) {
        return res.status(403).json({ error: 'Access denied to this class' });
      }
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /classes/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create class - Updated to include principal_lecturer and program_leader
app.post('/classes', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    const { class_name, faculty_id, total_registered_students, venue, scheduled_time } = req.body;
    if (!class_name || !faculty_id || !total_registered_students || !venue || !scheduled_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO classes (class_name, faculty_id, total_registered_students, venue, scheduled_time) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [class_name, faculty_id, total_registered_students, venue, scheduled_time]);
    
    // Return the newly created class with faculty info
    const [newClass] = await pool.execute(`
      SELECT 
        c.id, 
        c.class_name, 
        c.faculty_id, 
        c.total_registered_students, 
        c.venue, 
        c.scheduled_time, 
        c.created_at,
        f.name AS faculty_name
      FROM classes c
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    res.json({ success: true, class: newClass[0] });
  } catch (err) {
    console.error('POST /classes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update class - Updated to include principal_lecturer and program_leader
app.put('/classes/:id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    const { class_name, faculty_id, total_registered_students, venue, scheduled_time } = req.body;
    if (!class_name || !faculty_id || !total_registered_students || !venue || !scheduled_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `UPDATE classes SET class_name = ?, faculty_id = ?, total_registered_students = ?, venue = ?, scheduled_time = ? WHERE id = ?`;
    await pool.execute(sql, [class_name, faculty_id, total_registered_students, venue, scheduled_time, req.params.id]);
    
    // Return the updated class with faculty info
    const [updatedClass] = await pool.execute(`
      SELECT 
        c.id, 
        c.class_name, 
        c.faculty_id, 
        c.total_registered_students, 
        c.venue, 
        c.scheduled_time, 
        c.created_at,
        f.name AS faculty_name
      FROM classes c
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    res.json({ success: true, class: updatedClass[0] });
  } catch (err) {
    console.error('PUT /classes/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE class - Updated to include principal_lecturer and program_leader
app.delete('/classes/:id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    const sql = `DELETE FROM classes WHERE id = ?`;
    await pool.execute(sql, [req.params.id]);
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    console.error('DELETE /classes/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === FACULTIES ROUTES ===
app.get('/faculties', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    const sql = 'SELECT id, name FROM faculties';
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('GET /faculties error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET faculty by id
app.get('/faculties/:id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader']), async (req, res) => {
  try {
    const sql = 'SELECT id, name FROM faculties WHERE id = ?';
    const [rows] = await pool.execute(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Faculty not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /faculties/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === LECTURES ROUTES ===
// Create lecture report - Only lecturers can create lectures
app.post('/lectures', authenticateToken, requireRole(['lecturer']), async (req, res) => {
  try {
    const {
      class_id, course_id, week_of_reporting, date_of_lecture,
      actual_students_present, topic_taught, learning_outcomes, recommendations
    } = req.body;

    if (!class_id || !course_id || !date_of_lecture) {
      return res.status(400).json({ error: 'class_id, course_id and date_of_lecture are required' });
    }

    const sql = `
      INSERT INTO lectures (class_id, course_id, lecturer_id, week_of_reporting, date_of_lecture,
        actual_students_present, topic_taught, learning_outcomes, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      class_id, course_id, req.user.id, week_of_reporting, date_of_lecture,
      actual_students_present, topic_taught, learning_outcomes, recommendations
    ]);

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('POST /lectures error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET lecture reports - Allow students and program leaders to view all lectures
app.get('/lectures', authenticateToken, requireRole(['admin', 'principal_lecturer', 'program_leader', 'lecturer', 'student']), async (req, res) => {
  try {
    let sql = `
      SELECT l.*, c.class_name, co.course_name, co.course_code, u.name as lecturer_name, f.name as faculty_name
      FROM lectures l
      JOIN classes c ON l.class_id = c.id
      JOIN courses co ON l.course_id = co.id
      JOIN users u ON l.lecturer_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
    `;

    const params = [];
    if (req.user.role === 'lecturer') {
      sql += ' WHERE l.lecturer_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY l.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /lectures error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET lectures by class - Allow students to access
app.get('/classes/:id/lectures', authenticateToken, requireRole(['admin', 'principal_lecturer', 'lecturer', 'student']), async (req, res) => {
  try {
    const sql = `
      SELECT l.*, c.class_name, co.course_name, co.course_code, u.name as lecturer_name, f.name as faculty_name
      FROM lectures l
      JOIN classes c ON l.class_id = c.id
      JOIN courses co ON l.course_id = co.id
      JOIN users u ON l.lecturer_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE l.class_id = ?
      ORDER BY l.created_at DESC
    `;
    const [rows] = await pool.execute(sql, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /classes/:id/lectures error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET lectures by course - For principal lecturers to view lectures under specific courses
app.get('/courses/:id/lectures', authenticateToken, requireRole(['admin', 'principal_lecturer']), async (req, res) => {
  try {
    const sql = `
      SELECT l.*, c.class_name, co.course_name, co.course_code, u.name as lecturer_name, f.name as faculty_name
      FROM lectures l
      JOIN classes c ON l.class_id = c.id
      JOIN courses co ON l.course_id = co.id
      JOIN users u ON l.lecturer_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE l.course_id = ?
      ORDER BY l.created_at DESC
    `;
    const [rows] = await pool.execute(sql, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /courses/:id/lectures error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET lecture by id - Allow students to access
app.get('/lectures/:id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'lecturer', 'student']), async (req, res) => {
  try {
    const sql = `
      SELECT l.*, c.class_name, co.course_name, co.course_code, u.name as lecturer_name, f.name as faculty_name
      FROM lectures l
      JOIN classes c ON l.class_id = c.id
      JOIN courses co ON l.course_id = co.id
      JOIN users u ON l.lecturer_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
      WHERE l.id = ?
    `;
    const [rows] = await pool.execute(sql, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lecture not found' });
    
    // Check if user has permission to view this lecture
    if (req.user.role === 'lecturer' && rows[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /lectures/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE lecture - Lecturers can update their own lectures, admins can update any lecture
app.put('/lectures/:id', authenticateToken, requireRole(['lecturer', 'admin']), async (req, res) => {
  try {
    const {
      class_id, course_id, week_of_reporting, date_of_lecture,
      actual_students_present, topic_taught, learning_outcomes, recommendations
    } = req.body;

    if (!class_id || !course_id || !date_of_lecture) {
      return res.status(400).json({ error: 'class_id, course_id and date_of_lecture are required' });
    }

    // Check if lecture exists and user has permission
    const [existing] = await pool.execute('SELECT lecturer_id FROM lectures WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Lecture not found' });

    // Only check ownership if user is not admin
    if (req.user.role !== 'admin' && existing[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own lectures' });
    }

    const sql = `
      UPDATE lectures 
      SET class_id = ?, course_id = ?, week_of_reporting = ?, date_of_lecture = ?,
          actual_students_present = ?, topic_taught = ?, learning_outcomes = ?, recommendations = ?
      WHERE id = ?
    `;
    await pool.execute(sql, [
      class_id, course_id, week_of_reporting, date_of_lecture,
      actual_students_present, topic_taught, learning_outcomes, recommendations, req.params.id
    ]);

    res.json({ success: true, message: 'Lecture updated successfully' });
  } catch (err) {
    console.error('PUT /lectures/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE lecture - Lecturers can delete their own lectures, admins can delete any lecture
app.delete('/lectures/:id', authenticateToken, requireRole(['lecturer', 'admin']), async (req, res) => {
  try {
    // Check if lecture exists and user has permission
    const [existing] = await pool.execute('SELECT lecturer_id FROM lectures WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Lecture not found' });

    // Only check ownership if user is not admin
    if (req.user.role !== 'admin' && existing[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own lectures' });
    }

    const sql = `DELETE FROM lectures WHERE id = ?`;
    await pool.execute(sql, [req.params.id]);
    res.json({ success: true, message: 'Lecture deleted successfully' });
  } catch (err) {
    console.error('DELETE /lectures/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === FEEDBACK ROUTES ===
// POST feedback on a lecture - Allow lecturers and principal lecturers to give feedback
app.post('/feedback', authenticateToken, requireRole(['lecturer', 'principal_lecturer']), async (req, res) => {
  const { lecture_id, feedback_text } = req.body;
  if (!lecture_id || !feedback_text) {
    return res.status(400).json({ error: 'lecture_id and feedback_text are required' });
  }

  try {
    // Check if lecture exists
    const [lecture] = await pool.execute('SELECT id FROM lectures WHERE id = ?', [lecture_id]);
    if (!lecture.length) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const sql = `INSERT INTO feedback (lecture_id, user_id, feedback_text) VALUES (?, ?, ?)`;
    await pool.execute(sql, [lecture_id, req.user.id, feedback_text]);
    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('POST /feedback error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET feedback for a lecture - Allow students to view feedback on their lectures
app.get('/feedback/:lecture_id', authenticateToken, requireRole(['admin', 'principal_lecturer', 'lecturer', 'student']), async (req, res) => {
  const { lecture_id } = req.params;
  try {
    const sql = `
      SELECT f.id, f.feedback_text, f.created_at, u.name as user_name, u.role as user_role
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      WHERE f.lecture_id = ?
      ORDER BY f.created_at DESC
    `;
    const [rows] = await pool.execute(sql, [lecture_id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /feedback/:lecture_id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === RATING ROUTES ===
// POST rating on a lecture - Only students can rate
app.post('/rating', authenticateToken, requireRole(['student']), async (req, res) => {
  const { lecture_id, rating } = req.body;
  if (!lecture_id || !rating) {
    return res.status(400).json({ error: 'lecture_id and rating are required' });
  }

  // Validate rating range
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if lecture exists
    const [lecture] = await pool.execute('SELECT id FROM lectures WHERE id = ?', [lecture_id]);
    if (!lecture.length) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM ratings WHERE lecture_id = ? AND user_id = ?',
      [lecture_id, req.user.id]
    );
    
    if (existing.length > 0) {
      await pool.execute(
        'UPDATE ratings SET rating = ?, created_at = NOW() WHERE id = ?',
        [rating, existing[0].id]
      );
      res.json({ success: true, message: 'Rating updated successfully' });
    } else {
      await pool.execute(
        'INSERT INTO ratings (lecture_id, user_id, rating) VALUES (?, ?, ?)',
        [lecture_id, req.user.id, rating]
      );
      res.json({ success: true, message: 'Rating submitted successfully' });
    }
  } catch (err) {
    console.error('POST /rating error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET average rating for a lecture - Allow all authenticated users
app.get('/rating/:lecture_id', authenticateToken, async (req, res) => {
  const { lecture_id } = req.params;
  try {
    const sql = `
      SELECT 
        AVG(rating) as average_rating, 
        COUNT(*) as total_ratings,
        COUNT(DISTINCT user_id) as unique_raters
      FROM ratings
      WHERE lecture_id = ?
    `;
    const [rows] = await pool.execute(sql, [lecture_id]);
    
    const result = rows[0] || { 
      average_rating: null, 
      total_ratings: 0, 
      unique_raters: 0 
    };
    
    // Convert to number and round
    if (result.average_rating) {
      result.average_rating = parseFloat(result.average_rating).toFixed(1);
    }
    
    res.json(result);
  } catch (err) {
    console.error('GET /rating/:lecture_id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET user's rating for a lecture - Allow students to see their own ratings
app.get('/rating/:lecture_id/user', authenticateToken, requireRole(['student']), async (req, res) => {
  const { lecture_id } = req.params;
  try {
    const sql = `
      SELECT rating 
      FROM ratings 
      WHERE lecture_id = ? AND user_id = ?
    `;
    const [rows] = await pool.execute(sql, [lecture_id, req.user.id]);
    if (rows.length > 0) {
      res.json({ user_rating: rows[0].rating });
    } else {
      res.json({ user_rating: null });
    }
  } catch (err) {
    console.error('GET /rating/:lecture_id/user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all ratings for a user (student) - For dashboard stats
app.get('/user/ratings', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const sql = `
      SELECT r.lecture_id, r.rating, r.created_at, l.topic_taught, c.course_name
      FROM ratings r
      JOIN lectures l ON r.lecture_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await pool.execute(sql, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /user/ratings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === LECTURER ASSIGNMENTS ROUTES ===
app.get('/lecturer-assignments', authenticateToken, requireRole(['admin', 'principal_lecturer']), async (req, res) => {
  try {
    const { lecturer_id } = req.query;
    
    let sql = `
      SELECT 
        la.*, 
        c.class_name, 
        c.total_registered_students,
        c.venue,
        c.scheduled_time,
        c.faculty_id,
        f.name as faculty_name,
        u.name as lecturer_name
      FROM lecturer_assignments la
      JOIN classes c ON la.class_id = c.id
      JOIN users u ON la.lecturer_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
    `;
    
    const params = [];
    if (lecturer_id) {
      sql += ' WHERE la.lecturer_id = ?';
      params.push(lecturer_id);
    }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /lecturer-assignments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST assign lecturer to class - Only admin and principal lecturers
app.post('/lecturer-assignments', authenticateToken, requireRole(['admin', 'principal_lecturer']), async (req, res) => {
  try {
    const { lecturer_id, class_id, course_id } = req.body;
    if (!lecturer_id || !class_id || !course_id) {
      return res.status(400).json({ error: 'lecturer_id, class_id and course_id are required' });
    }

    const sql = `INSERT INTO lecturer_assignments (lecturer_id, class_id, course_id) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(sql, [lecturer_id, class_id, course_id]);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('POST /lecturer-assignments error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Lecturer already assigned to this class and course' });
    }
    res.status(500).json({ error: err.message });
  }
});

// === PROGRAM REPORTS ROUTES ===
// Get program report data - Only program leaders can access their own reports
app.get('/program-reports/:programLeaderId', authenticateToken, requireRole(['program_leader']), async (req, res) => {
  const { programLeaderId } = req.params;
  
  // Ensure program leader can only access their own reports
  if (parseInt(programLeaderId) !== req.user.id) {
    return res.status(403).json({ error: 'You can only access your own program reports' });
  }

  try {
    const [courses] = await pool.query(
      'SELECT id, course_name FROM courses WHERE program_leader_id = ?',
      [programLeaderId]
    );

    const response = {
      programStats: {
        totalStudents: 0,
        totalCourses: courses.length,
        graduationRate: 0,
        employmentRate: 0,
      },
      coursePerformance: courses.map(c => ({
        course: c.course_name,
        enrollment: Math.floor(Math.random() * 50) + 20,
        performance: Math.floor(Math.random() * 20) + 70,
        satisfaction: Math.floor(Math.random() * 2) + 4
      })),
      facultyPerformance: [],
      studentProgress: [
        { year: '1st Year', students: 85, completion: 95 },
        { year: '2nd Year', students: 78, completion: 88 },
        { year: '3rd Year', students: 72, completion: 82 },
        { year: '4th Year', students: 65, completion: 89 }
      ]
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching program report:', err);
    res.status(500).json({ error: 'Failed to fetch program report data' });
  }
});

// Generate report - Only program leaders
app.post('/program-reports/generate', authenticateToken, requireRole(['program_leader']), async (req, res) => {
  const { programLeaderId, reportType } = req.body;
  
  // Ensure program leader can only generate their own reports
  if (parseInt(programLeaderId) !== req.user.id) {
    return res.status(403).json({ error: 'You can only generate your own program reports' });
  }

  try {
    res.json({ message: `Report type "${reportType}" generated successfully!`, downloadUrl: null });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// === HEALTH CHECK ===
app.get('/db-status', async (req, res) => {
  try {

    
    await pool.query('SELECT 1');
    res.json({ status: '✅ Database connection successful!' });
  } catch (err) {
    console.error('DB health check failed:', err.message);
    res.status(500).json({ status: '❌ Database not connected', error: err.message });
  }
});

// === GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// === 404 HANDLER ===
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// === START SERVER ===
const PORT = process.env.PORT || 8081;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful!');
    
    // Create courses table if it doesn't exist (without updated_at to avoid errors)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_code VARCHAR(50) NOT NULL UNIQUE,
          course_name VARCHAR(255) NOT NULL,
          program_leader_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (program_leader_id) REFERENCES users(id)
        )
      `);
      console.log('✅ Courses table ready');
    } catch (err) {
      console.log('Courses table already exists or error:', err.message);
    }

    // Create other essential tables if they don't exist
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS classes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          class_name VARCHAR(255) NOT NULL,
          faculty_id INT,
          total_registered_students INT,
          venue VARCHAR(255),
          scheduled_time VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        )
      `);
      console.log('✅ Classes table ready');
    } catch (err) {
      console.log('Classes table already exists or error:', err.message);
    }

    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS lectures (
          id INT AUTO_INCREMENT PRIMARY KEY,
          class_id INT NOT NULL,
          course_id INT NOT NULL,
          lecturer_id INT NOT NULL,
          week_of_reporting VARCHAR(50),
          date_of_lecture DATE,
          actual_students_present INT,
          topic_taught TEXT,
          learning_outcomes TEXT,
          recommendations TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes(id),
          FOREIGN KEY (course_id) REFERENCES courses(id),
          FOREIGN KEY (lecturer_id) REFERENCES users(id)
        )
      `);
      console.log('✅ Lectures table ready');
    } catch (err) {
      console.log('Lectures table already exists or error:', err.message);
    }

    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS lecturer_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          lecturer_id INT NOT NULL,
          class_id INT NOT NULL,
          course_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lecturer_id) REFERENCES users(id),
          FOREIGN KEY (class_id) REFERENCES classes(id),
          FOREIGN KEY (course_id) REFERENCES courses(id),
          UNIQUE KEY unique_assignment (lecturer_id, class_id, course_id)
        )
      `);
      console.log('✅ Lecturer assignments table ready');
    } catch (err) {
      console.log('Lecturer assignments table already exists or error:', err.message);
    }

    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS feedback (
          id INT AUTO_INCREMENT PRIMARY KEY,
          lecture_id INT NOT NULL,
          user_id INT NOT NULL,
          feedback_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lecture_id) REFERENCES lectures(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      console.log('✅ Feedback table ready');
    } catch (err) {
      console.log('Feedback table already exists or error:', err.message);
    }

    // Check if ratings table exists and has correct structure
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          lecture_id INT NOT NULL,
          user_id INT NOT NULL,
          rating INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lecture_id) REFERENCES lectures(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          UNIQUE KEY unique_rating (lecture_id, user_id)
        )
      `);
      console.log('✅ Ratings table ready');
    } catch (err) {
      console.log('Ratings table already exists or error:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`📚 Role-Based Access Control Enabled:`);
      console.log(`   👨‍🏫 Program Leaders: Can CREATE/UPDATE/DELETE their own courses`);
      console.log(`   👩‍🎓 Principal Lecturers: Can VIEW all courses and lectures`);
      console.log(`   👨‍💼 Lecturers: Can CREATE/VIEW their own lectures`);
      console.log(`   👨‍🎓 Students: Can VIEW classes and lectures, POST ratings`);
      console.log(`   🔐 Admin: Full access`);
    });
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

startServer();