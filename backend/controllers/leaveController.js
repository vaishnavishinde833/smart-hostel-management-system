const LeaveModel   = require('../models/leaveModel');
const StudentModel = require('../models/studentModel');
const HostelModel  = require('../models/hostelModel');

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidDate(str) {
  const d = new Date(str);
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

async function getWardenHostel(wardenUserId) {
  const hostel = await HostelModel.findByWardenId(wardenUserId);
  if (!hostel) {
    const err = new Error('No hostel is assigned to you. Contact admin.');
    err.statusCode = 403;
    throw err;
  }
  return hostel;
}

// Check whether a leave request belongs to the warden's hostel
async function assertLeaveInHostel(leave_id, hostel_id) {
  const LeaveModel = require('../models/leaveModel');
  const rows = await LeaveModel.findAllByHostel(hostel_id);
  const belongs = rows.some(r => r.id === Number(leave_id));
  if (!belongs) {
    const err = new Error('Access denied. Leave request does not belong to your hostel.');
    err.statusCode = 403;
    throw err;
  }
}

// ── Controllers ────────────────────────────────────────────────────────────

// POST /api/leave-requests  — Student only
async function createLeaveRequest(req, res) {
  const { from_date, to_date, reason } = req.body;

  if (!from_date || !to_date || !reason) {
    return res.status(400).json({ success: false, message: 'from_date, to_date, and reason are required' });
  }
  if (!isValidDate(from_date)) {
    return res.status(400).json({ success: false, message: 'from_date must be a valid date in YYYY-MM-DD format' });
  }
  if (!isValidDate(to_date)) {
    return res.status(400).json({ success: false, message: 'to_date must be a valid date in YYYY-MM-DD format' });
  }
  if (from_date > to_date) {
    return res.status(400).json({ success: false, message: 'from_date cannot be after to_date' });
  }
  if (!reason.trim()) {
    return res.status(400).json({ success: false, message: 'reason cannot be empty' });
  }

  const student = await StudentModel.findByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  // Prevent overlapping pending/approved leaves
  const overlaps = await LeaveModel.findOverlapping(student.id, from_date, to_date);
  if (overlaps.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'You already have a pending or approved leave request that overlaps with these dates',
    });
  }

  const id = await LeaveModel.create({ student_id: student.id, from_date, to_date, reason: reason.trim() });
  const leave = await LeaveModel.findById(id);
  res.status(201).json({ success: true, message: 'Leave request submitted successfully', leave });
}

// GET /api/leave-requests  — Admin (all) | Warden (hostel-scoped) | Student (own)
async function getAllLeaveRequests(req, res) {
  let leaves;

  if (req.user.role === 'admin') {
    leaves = await LeaveModel.findAll();
  } else if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    leaves = await LeaveModel.findAllByHostel(hostel.id);
  } else {
    const student = await StudentModel.findByUserId(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    leaves = await LeaveModel.findAll(student.id);
  }

  res.json({ success: true, count: leaves.length, leaves });
}

// GET /api/leave-requests/:id  — Admin | Warden (hostel-scoped) | Student (own)
async function getLeaveRequestById(req, res) {
  const leave = await LeaveModel.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }

  if (req.user.role === 'student') {
    const student = await StudentModel.findByUserId(req.user.id);
    if (!student || leave.student_id !== student.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    await assertLeaveInHostel(req.params.id, hostel.id);
  }

  res.json({ success: true, leave });
}

// PATCH /api/leave-requests/:id/approve  — Admin | Warden (hostel-scoped)
async function approveLeaveRequest(req, res) {
  const leave = await LeaveModel.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }
  if (leave.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Leave request is already ${leave.status} and cannot be approved`,
    });
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    await assertLeaveInHostel(req.params.id, hostel.id);
  }

  const { remarks } = req.body;
  await LeaveModel.updateStatus(req.params.id, { status: 'approved', approved_by: req.user.id, remarks });
  const updated = await LeaveModel.findById(req.params.id);
  res.json({ success: true, message: 'Leave request approved', leave: updated });
}

// PATCH /api/leave-requests/:id/reject  — Admin | Warden (hostel-scoped)
async function rejectLeaveRequest(req, res) {
  const leave = await LeaveModel.findById(req.params.id);
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }
  if (leave.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Leave request is already ${leave.status} and cannot be rejected`,
    });
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    await assertLeaveInHostel(req.params.id, hostel.id);
  }

  const { remarks } = req.body;
  await LeaveModel.updateStatus(req.params.id, { status: 'rejected', approved_by: req.user.id, remarks });
  const updated = await LeaveModel.findById(req.params.id);
  res.json({ success: true, message: 'Leave request rejected', leave: updated });
}

module.exports = { createLeaveRequest, getAllLeaveRequests, getLeaveRequestById, approveLeaveRequest, rejectLeaveRequest };
