const ComplaintModel = require('../models/complaintModel');
const StudentModel   = require('../models/studentModel');
const HostelModel    = require('../models/hostelModel');

// ── Constants ──────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['maintenance', 'food', 'security', 'hygiene', 'other'];
const VALID_STATUSES   = ['pending', 'in_progress', 'resolved', 'rejected'];

// ── Helpers ────────────────────────────────────────────────────────────────

async function getWardenHostel(wardenUserId) {
  const hostel = await HostelModel.findByWardenId(wardenUserId);
  if (!hostel) {
    const err = new Error('No hostel is assigned to you. Contact admin.');
    err.statusCode = 403;
    throw err;
  }
  return hostel;
}

// ── Controllers ────────────────────────────────────────────────────────────

// POST /api/complaints  — Student only
async function createComplaint(req, res) {
  const { category, description } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ success: false, message: 'description is required' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  const student = await StudentModel.findByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const id = await ComplaintModel.create({
    student_id: student.id,
    category: category || 'other',
    description: description.trim(),
  });

  const complaint = await ComplaintModel.findById(id);
  res.status(201).json({ success: true, message: 'Complaint submitted successfully', complaint });
}

// GET /api/complaints  — Admin (all) | Warden (own hostel) | Student (own only)
async function getAllComplaints(req, res) {
  let complaints;

  if (req.user.role === 'admin') {
    complaints = await ComplaintModel.findAll();
  } else if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    complaints = await ComplaintModel.findAllByHostel(hostel.id);
  } else {
    // Student: own complaints only
    const student = await StudentModel.findByUserId(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    complaints = await ComplaintModel.findAll(student.id);
  }

  res.json({ success: true, count: complaints.length, complaints });
}

// GET /api/complaints/:id  — Admin | Warden (own hostel) | Student (own)
async function getComplaintById(req, res) {
  const complaint = await ComplaintModel.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  if (req.user.role === 'student') {
    const student = await StudentModel.findByUserId(req.user.id);
    if (!student || complaint.student_id !== student.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    // Verify this student has an allocation in the warden's hostel
    const hostelComplaints = await ComplaintModel.findAllByHostel(hostel.id);
    const belongs = hostelComplaints.some(c => c.id === Number(req.params.id));
    if (!belongs) {
      return res.status(403).json({ success: false, message: 'Access denied. Complaint does not belong to your hostel.' });
    }
  }

  res.json({ success: true, complaint });
}

// PATCH /api/complaints/:id/status  — Admin | Warden (own hostel)
async function updateComplaintStatus(req, res) {
  const complaint = await ComplaintModel.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  const { status, response } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'status is required' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }
  if (complaint.status === 'resolved' || complaint.status === 'rejected') {
    return res.status(400).json({
      success: false,
      message: `Complaint is already ${complaint.status} and cannot be updated`,
    });
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    const hostelComplaints = await ComplaintModel.findAllByHostel(hostel.id);
    const belongs = hostelComplaints.some(c => c.id === Number(req.params.id));
    if (!belongs) {
      return res.status(403).json({ success: false, message: 'Access denied. Complaint does not belong to your hostel.' });
    }
  }

  await ComplaintModel.updateStatus(req.params.id, { status, response });
  const updated = await ComplaintModel.findById(req.params.id);
  res.json({ success: true, message: 'Complaint status updated', complaint: updated });
}

module.exports = { createComplaint, getAllComplaints, getComplaintById, updateComplaintStatus };
