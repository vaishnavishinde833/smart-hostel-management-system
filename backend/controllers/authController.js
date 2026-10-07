const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const StudentModel = require('../models/studentModel');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // For student role, attach their student profile
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await StudentModel.findByUserId(user.id);
  }

  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...(studentProfile && { studentId: studentProfile.id, studentCode: studentProfile.student_code }),
    },
  });
}

// GET /api/auth/me  (protected)
async function getMe(req, res) {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await StudentModel.findByUserId(user.id);
  }

  res.json({
    success: true,
    user: {
      ...user,
      ...(studentProfile && { studentProfile }),
    },
  });
}

// POST /api/auth/register  (admin only — creates admin/warden accounts)
// Students are created via the student management module
async function register(req, res) {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'name, email, password, and role are required' });
  }

  const allowedRoles = ['admin', 'warden'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'This endpoint only creates admin or warden accounts' });
  }

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const userId = await UserModel.create({ name, email, password: hashed, role, phone });
  const newUser = await UserModel.findById(userId);

  res.status(201).json({
    success: true,
    message: `${role} account created successfully`,
    user: newUser,
  });
}

module.exports = { login, getMe, register };
