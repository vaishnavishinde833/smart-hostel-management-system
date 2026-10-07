const { pool }       = require('../config/db');
const HostelModel    = require('../models/hostelModel');
const StudentModel   = require('../models/studentModel');
const AllocationModel = require('../models/allocationModel');
const ComplaintModel = require('../models/complaintModel');
const LeaveModel     = require('../models/leaveModel');
const NoticeModel    = require('../models/noticeModel');

// ── Shared query helpers ────────────────────────────────────────────────────

async function roomStats(hostel_id = null) {
  let q = `
    SELECT
      COUNT(*)                                                        AS total_rooms,
      SUM(r.capacity)                                                 AS total_capacity,
      SUM((SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.status = 'active')) AS occupied_beds
    FROM rooms r
  `;
  const params = [];
  if (hostel_id) { q += ' WHERE r.hostel_id = ?'; params.push(hostel_id); }
  const [rows] = await pool.query(q, params);
  const row = rows[0];
  const total_capacity  = Number(row.total_capacity)  || 0;
  const occupied_beds   = Number(row.occupied_beds)   || 0;
  return {
    total_rooms:     Number(row.total_rooms) || 0,
    total_capacity,
    occupied_beds,
    available_beds:  total_capacity - occupied_beds,
  };
}

async function activeAllocations(hostel_id = null) {
  let q = `
    SELECT COUNT(*) AS cnt FROM allocations a
    JOIN rooms r ON a.room_id = r.id
    WHERE a.status = 'active'
  `;
  const params = [];
  if (hostel_id) { q += ' AND r.hostel_id = ?'; params.push(hostel_id); }
  const [[row]] = await pool.query(q, params);
  return Number(row.cnt);
}

async function pendingComplaints(hostel_id = null) {
  let q = `
    SELECT COUNT(*) AS cnt FROM complaints c
    JOIN students s ON c.student_id = s.id
  `;
  const params = [];
  if (hostel_id) {
    q += `
      JOIN allocations a ON a.student_id = s.id
      JOIN rooms r ON a.room_id = r.id
      WHERE c.status = 'pending' AND r.hostel_id = ?
    `;
    params.push(hostel_id);
  } else {
    q += " WHERE c.status = 'pending'";
  }
  const [[row]] = await pool.query(q, params);
  return Number(row.cnt);
}

async function pendingLeaves(hostel_id = null) {
  let q = `
    SELECT COUNT(*) AS cnt FROM leave_requests l
    JOIN students s ON l.student_id = s.id
  `;
  const params = [];
  if (hostel_id) {
    q += `
      JOIN allocations a ON a.student_id = s.id
      JOIN rooms r ON a.room_id = r.id
      WHERE l.status = 'pending' AND r.hostel_id = ?
    `;
    params.push(hostel_id);
  } else {
    q += " WHERE l.status = 'pending'";
  }
  const [[row]] = await pool.query(q, params);
  return Number(row.cnt);
}

async function recentComplaints(limit = 5, hostel_id = null) {
  let q = `
    SELECT c.id, c.category, c.status, c.created_at, u.name AS student_name
    FROM complaints c
    JOIN students s ON c.student_id = s.id
    JOIN users u ON s.user_id = u.id
  `;
  const params = [];
  if (hostel_id) {
    q += `
      JOIN allocations a ON a.student_id = s.id
      JOIN rooms r ON a.room_id = r.id
      WHERE r.hostel_id = ?
    `;
    params.push(hostel_id);
  }
  q += ' ORDER BY c.created_at DESC LIMIT ?';
  params.push(limit);
  const [rows] = await pool.query(q, params);
  return rows;
}

async function recentLeaves(limit = 5, hostel_id = null) {
  let q = `
    SELECT l.id, l.from_date, l.to_date, l.status, l.created_at, u.name AS student_name
    FROM leave_requests l
    JOIN students s ON l.student_id = s.id
    JOIN users u ON s.user_id = u.id
  `;
  const params = [];
  if (hostel_id) {
    q += `
      JOIN allocations a ON a.student_id = s.id
      JOIN rooms r ON a.room_id = r.id
      WHERE r.hostel_id = ?
    `;
    params.push(hostel_id);
  }
  q += ' ORDER BY l.created_at DESC LIMIT ?';
  params.push(limit);
  const [rows] = await pool.query(q, params);
  return rows;
}

async function recentNotices(limit = 5, target_role = null) {
  let q = `
    SELECT n.id, n.title, n.target_role, n.created_at, u.name AS author_name
    FROM notices n JOIN users u ON n.author_id = u.id
  `;
  const params = [];
  if (target_role) {
    q += " WHERE n.target_role = 'all' OR n.target_role = ?";
    params.push(target_role);
  }
  q += ' ORDER BY n.created_at DESC LIMIT ?';
  params.push(limit);
  const [rows] = await pool.query(q, params);
  return rows;
}

async function hostelStudentCount(hostel_id) {
  const [[row]] = await pool.query(`
    SELECT COUNT(DISTINCT s.id) AS cnt
    FROM students s
    JOIN allocations a ON a.student_id = s.id
    JOIN rooms r ON a.room_id = r.id
    WHERE r.hostel_id = ? AND a.status = 'active'
  `, [hostel_id]);
  return Number(row.cnt);
}

// ── Dashboard controllers ──────────────────────────────────────────────────

// GET /api/dashboard/admin  — Admin only
async function adminDashboard(req, res) {
  const [[studentRow]] = await pool.query('SELECT COUNT(*) AS cnt FROM students');
  const [[hostelRow]]  = await pool.query('SELECT COUNT(*) AS cnt FROM hostels');

  const [rooms, activeAlloc, pendingC, pendingL, recentC, recentL, recentN] = await Promise.all([
    roomStats(),
    activeAllocations(),
    pendingComplaints(),
    pendingLeaves(),
    recentComplaints(5),
    recentLeaves(5),
    recentNotices(5),
  ]);

  res.json({
    success: true,
    dashboard: {
      stats: {
        total_students:       Number(studentRow.cnt),
        total_hostels:        Number(hostelRow.cnt),
        total_rooms:          rooms.total_rooms,
        total_capacity:       rooms.total_capacity,
        occupied_beds:        rooms.occupied_beds,
        available_beds:       rooms.available_beds,
        active_allocations:   activeAlloc,
        pending_complaints:   pendingC,
        pending_leave_requests: pendingL,
      },
      recent_complaints:    recentC,
      recent_leave_requests: recentL,
      recent_notices:        recentN,
    },
  });
}

// GET /api/dashboard/warden  — Warden only
async function wardenDashboard(req, res) {
  const hostel = await HostelModel.findByWardenId(req.user.id);
  if (!hostel) {
    return res.status(403).json({ success: false, message: 'No hostel is assigned to you. Contact admin.' });
  }

  const [hostelStudents, rooms, activeAlloc, pendingC, pendingL, recentC, recentL, recentN] = await Promise.all([
    hostelStudentCount(hostel.id),
    roomStats(hostel.id),
    activeAllocations(hostel.id),
    pendingComplaints(hostel.id),
    pendingLeaves(hostel.id),
    recentComplaints(5, hostel.id),
    recentLeaves(5, hostel.id),
    recentNotices(5, 'warden'),
  ]);

  res.json({
    success: true,
    dashboard: {
      hostel: { id: hostel.id, name: hostel.name, address: hostel.address },
      stats: {
        hostel_students:        hostelStudents,
        total_rooms:            rooms.total_rooms,
        total_capacity:         rooms.total_capacity,
        occupied_beds:          rooms.occupied_beds,
        available_beds:         rooms.available_beds,
        active_allocations:     activeAlloc,
        pending_complaints:     pendingC,
        pending_leave_requests: pendingL,
      },
      recent_complaints:     recentC,
      recent_leave_requests: recentL,
      recent_notices:        recentN,
    },
  });
}

// GET /api/dashboard/student  — Student only
async function studentDashboard(req, res) {
  const student = await StudentModel.findByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const [currentAllocation, complaints, leaveRequests, notices] = await Promise.all([
    AllocationModel.findActiveByStudent(student.id),
    ComplaintModel.findAll(student.id),
    LeaveModel.findAll(student.id),
    recentNotices(10, 'student'),
  ]);

  const pendingC = complaints.filter(c => c.status === 'pending').length;
  const pendingL = leaveRequests.filter(l => l.status === 'pending').length;

  res.json({
    success: true,
    dashboard: {
      profile: {
        name:         student.name,
        email:        student.email,
        student_code: student.student_code,
        course:       student.course,
        year:         student.year,
      },
      current_allocation: currentAllocation || null,
      stats: {
        total_complaints:    complaints.length,
        pending_complaints:  pendingC,
        total_leaves:        leaveRequests.length,
        pending_leaves:      pendingL,
      },
      recent_complaints:    complaints.slice(0, 5),
      recent_leave_requests: leaveRequests.slice(0, 5),
      notices,
    },
  });
}

module.exports = { adminDashboard, wardenDashboard, studentDashboard };
