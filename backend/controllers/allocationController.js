const AllocationModel = require('../models/allocationModel');
const StudentModel    = require('../models/studentModel');
const RoomModel       = require('../models/roomModel');
const HostelModel     = require('../models/hostelModel');

// ── Helpers ────────────────────────────────────────────────────────────────

// Resolve the hostel a warden manages; throw 403 if unassigned
async function getWardenHostel(wardenUserId) {
  const hostel = await HostelModel.findByWardenId(wardenUserId);
  if (!hostel) {
    const err = new Error('No hostel is assigned to you. Contact admin.');
    err.statusCode = 403;
    throw err;
  }
  return hostel;
}

// Ensure a room belongs to the warden's hostel
function assertRoomInHostel(room, hostelId) {
  if (room.hostel_id !== Number(hostelId)) {
    const err = new Error('Access denied. Room does not belong to your assigned hostel.');
    err.statusCode = 403;
    throw err;
  }
}

// Ensure an allocation's room belongs to the warden's hostel
function assertAllocationInHostel(allocation, hostelId) {
  // allocation has hostel_name but not hostel_id; we join via rooms in the query
  // We re-check by looking up the room — handled in the calling controller with the room
}

// ── Controllers ────────────────────────────────────────────────────────────

// POST /api/allocations  — Admin | Warden (own hostel only)
async function createAllocation(req, res) {
  const { student_id, room_id, allocated_date } = req.body;

  if (!student_id || !room_id) {
    return res.status(400).json({ success: false, message: 'student_id and room_id are required' });
  }

  // Student must exist and be active
  const student = await StudentModel.findById(student_id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  if (!student.is_active) {
    return res.status(400).json({ success: false, message: 'Cannot allocate room to a deactivated student' });
  }

  // Room must exist
  const room = await RoomModel.findById(room_id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  // Warden: room must be in their hostel
  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    assertRoomInHostel(room, hostel.id);
  }

  // Room must not be under maintenance
  if (room.status === 'maintenance') {
    return res.status(400).json({ success: false, message: 'Room is under maintenance and cannot be allocated' });
  }

  // Check for available beds
  const occupied = await RoomModel.getOccupiedCount(room_id);
  if (occupied >= room.capacity) {
    return res.status(409).json({
      success: false,
      message: `Room "${room.room_number}" is full (capacity: ${room.capacity}, occupied: ${occupied})`,
    });
  }

  // Student must not already have an active allocation
  const existing = await AllocationModel.findActiveByStudent(student_id);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: `Student already has an active allocation in room "${existing.room_number}" (hostel: ${existing.hostel_name})`,
    });
  }

  const id = await AllocationModel.create({ student_id, room_id, allocated_date });

  // Auto-update room status to 'full' if now at capacity
  const newOccupied = occupied + 1;
  if (newOccupied >= room.capacity) {
    await RoomModel.updateStatus(room_id, 'full');
  }

  const allocation = await AllocationModel.findById(id);
  res.status(201).json({ success: true, message: 'Room allocated successfully', allocation });
}

// GET /api/allocations  — Admin (all) | Warden (own hostel) | Student blocked
async function getAllAllocations(req, res) {
  let allocations;

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    allocations = await AllocationModel.findAllByHostel(hostel.id);
  } else {
    allocations = await AllocationModel.findAll();
  }

  res.json({ success: true, count: allocations.length, allocations });
}

// GET /api/allocations/:id  — Admin | Warden (own hostel) | Student (own only)
async function getAllocationById(req, res) {
  const allocation = await AllocationModel.findById(req.params.id);
  if (!allocation) {
    return res.status(404).json({ success: false, message: 'Allocation not found' });
  }

  if (req.user.role === 'student') {
    const student = await StudentModel.findByUserId(req.user.id);
    if (!student || allocation.student_id !== student.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    const room = await RoomModel.findById(allocation.room_id);
    assertRoomInHostel(room, hostel.id);
  }

  res.json({ success: true, allocation });
}

// GET /api/allocations/student/:studentId  — Admin | Warden (own hostel) | Student (own only)
async function getStudentAllocations(req, res) {
  const student = await StudentModel.findById(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  // Students may only view their own
  if (req.user.role === 'student') {
    const self = await StudentModel.findByUserId(req.user.id);
    if (!self || self.id !== student.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  // Warden: check the student's active allocation is in their hostel
  if (req.user.role === 'warden') {
    const active = await AllocationModel.findActiveByStudent(student.id);
    if (active) {
      const hostel = await getWardenHostel(req.user.id);
      const room = await RoomModel.findById(active.room_id);
      assertRoomInHostel(room, hostel.id);
    }
  }

  const allocations = await AllocationModel.findAllByStudent(req.params.studentId);
  res.json({ success: true, count: allocations.length, allocations });
}

// GET /api/allocations/my  — Student only: their current active allocation
async function getMyAllocation(req, res) {
  const student = await StudentModel.findByUserId(req.user.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const allocation = await AllocationModel.findActiveByStudent(student.id);
  if (!allocation) {
    return res.status(404).json({ success: false, message: 'You do not have an active room allocation' });
  }

  res.json({ success: true, allocation });
}

// PATCH /api/allocations/:id/vacate  — Admin | Warden (own hostel)
async function vacateAllocation(req, res) {
  const allocation = await AllocationModel.findById(req.params.id);
  if (!allocation) {
    return res.status(404).json({ success: false, message: 'Allocation not found' });
  }

  if (allocation.status === 'vacated') {
    return res.status(400).json({ success: false, message: 'This allocation is already vacated' });
  }

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    const room = await RoomModel.findById(allocation.room_id);
    assertRoomInHostel(room, hostel.id);
  }

  await AllocationModel.vacate(req.params.id);

  // After vacating, mark room as 'available' if it was 'full'
  const room = await RoomModel.findById(allocation.room_id);
  if (room && room.status === 'full') {
    await RoomModel.updateStatus(allocation.room_id, 'available');
  }

  const updated = await AllocationModel.findById(req.params.id);
  res.json({ success: true, message: 'Room vacated successfully', allocation: updated });
}

module.exports = {
  createAllocation,
  getAllAllocations,
  getAllocationById,
  getStudentAllocations,
  getMyAllocation,
  vacateAllocation,
};
