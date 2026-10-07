const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const StudentModel = require('../models/studentModel');

// ── Helpers ────────────────────────────────────────────────────────────────

function stripPassword(obj) {
  if (!obj) return null;
  const { password, ...safe } = obj;
  return safe;
}

function validateCreateBody(body) {
  const { name, email, password, student_code, course, year } = body;
  if (!name || !email || !password || !student_code || !course) {
    return 'name, email, password, student_code, and course are required';
  }
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (year && (isNaN(year) || year < 1 || year > 6)) return 'year must be between 1 and 6';
  return null;
}

// ── Controllers ────────────────────────────────────────────────────────────

// POST /api/students  — Admin / Warden
// Creates user account + student profile atomically
async function createStudent(req, res) {
  const { name, email, password, phone, student_code, course, year, parent_name, parent_phone, address } = req.body;

  const error = validateCreateBody(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  const existingEmail = await UserModel.findByEmail(email);
  if (existingEmail) return res.status(409).json({ success: false, message: 'Email already registered' });

  const existingCode = await StudentModel.findByStudentCode(student_code);
  if (existingCode) return res.status(409).json({ success: false, message: 'Student code already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const userId = await UserModel.create({ name, email, password: hashed, role: 'student', phone });
  await StudentModel.create({ user_id: userId, student_code, course, year, parent_name, parent_phone, address });

  const student = await StudentModel.findByUserId(userId);
  res.status(201).json({ success: true, message: 'Student created successfully', student: stripPassword(student) });
}

// GET /api/students  — Admin / Warden
async function getAllStudents(req, res) {
  const students = await StudentModel.findAll();
  res.json({ success: true, count: students.length, students: students.map(stripPassword) });
}

// GET /api/students/:id  — Admin / Warden / self (student accessing own profile)
async function getStudentById(req, res) {
  const student = await StudentModel.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  // Students can only access their own profile
  if (req.user.role === 'student' && student.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, student: stripPassword(student) });
}

// PUT /api/students/:id  — Admin / Warden
// Updates student profile fields AND user-level name/phone
async function updateStudent(req, res) {
  const student = await StudentModel.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const { name, phone, is_active, course, year, parent_name, parent_phone, address } = req.body;

  if (year && (isNaN(year) || year < 1 || year > 6)) {
    return res.status(400).json({ success: false, message: 'year must be between 1 and 6' });
  }

  // Update users table (name, phone, is_active)
  await UserModel.update(student.user_id, {
    name: name || student.name,
    phone: phone !== undefined ? phone : student.phone,
    is_active: is_active !== undefined ? is_active : student.is_active,
  });

  // Update students table (academic + family info)
  await StudentModel.update(req.params.id, {
    course: course || student.course,
    year: year || student.year,
    parent_name: parent_name !== undefined ? parent_name : student.parent_name,
    parent_phone: parent_phone !== undefined ? parent_phone : student.parent_phone,
    address: address !== undefined ? address : student.address,
  });

  const updated = await StudentModel.findById(req.params.id);
  res.json({ success: true, message: 'Student updated successfully', student: stripPassword(updated) });
}

// DELETE /api/students/:id  — Admin only
// Hard deletes user (cascades to student record via FK)
async function deleteStudent(req, res) {
  const student = await StudentModel.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  await StudentModel.delete(req.params.id);
  res.json({ success: true, message: 'Student deleted successfully' });
}

// PATCH /api/students/:id/deactivate  — Admin / Warden
// Soft deactivation — keeps record, blocks login
async function deactivateStudent(req, res) {
  const student = await StudentModel.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  await UserModel.update(student.user_id, {
    name: student.name,
    phone: student.phone,
    is_active: 0,
  });
  res.json({ success: true, message: 'Student deactivated successfully' });
}

// PATCH /api/students/:id/activate  — Admin / Warden
async function activateStudent(req, res) {
  const student = await StudentModel.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  await UserModel.update(student.user_id, {
    name: student.name,
    phone: student.phone,
    is_active: 1,
  });
  res.json({ success: true, message: 'Student activated successfully' });
}

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, deactivateStudent, activateStudent };
