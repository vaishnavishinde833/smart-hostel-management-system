const RoomModel   = require('../models/roomModel');
const HostelModel = require('../models/hostelModel');

// ── Helpers ────────────────────────────────────────────────────────────────

const VALID_TYPES   = ['single', 'double', 'triple'];
const VALID_STATUSES = ['available', 'full', 'maintenance'];

// Resolve the hostel a warden owns; throw 403 if they don't own hostelId
async function assertWardenOwnsHostel(wardenUserId, hostelId) {
  const assigned = await HostelModel.findByWardenId(wardenUserId);
  if (!assigned || assigned.id !== Number(hostelId)) {
    const err = new Error('Access denied. You can only manage rooms in your assigned hostel.');
    err.statusCode = 403;
    throw err;
  }
}

// Return the hostel a warden is assigned to, or throw 403 if none
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

// POST /api/rooms  — Admin | Warden (own hostel only)
async function createRoom(req, res) {
  let { hostel_id, room_number, floor, type, capacity } = req.body;

  if (!hostel_id || !room_number) {
    return res.status(400).json({ success: false, message: 'hostel_id and room_number are required' });
  }

  capacity = req.body.capacity !== undefined ? Number(req.body.capacity) : 2;
  if (!Number.isInteger(capacity) || capacity < 1) {
    return res.status(400).json({ success: false, message: 'capacity must be a positive integer' });
  }

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }

  // Hostel must exist
  const hostel = await HostelModel.findById(hostel_id);
  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  // Wardens can only add rooms to their own hostel
  if (req.user.role === 'warden') {
    await assertWardenOwnsHostel(req.user.id, hostel_id);
  }

  // No duplicate room numbers within the same hostel
  const duplicate = await RoomModel.findByRoomNumber(hostel_id, room_number.trim());
  if (duplicate) {
    return res.status(409).json({ success: false, message: `Room "${room_number}" already exists in this hostel` });
  }

  const id = await RoomModel.create({
    hostel_id,
    room_number: room_number.trim(),
    floor: floor !== undefined ? Number(floor) : 0,
    type: type || 'double',
    capacity,
  });

  const room = await RoomModel.findById(id);
  res.status(201).json({ success: true, message: 'Room created successfully', room });
}

// GET /api/rooms  — All roles (admin sees all; warden filtered to own hostel; student sees all)
async function getAllRooms(req, res) {
  let hostel_id = req.query.hostel_id || null;

  // Warden: always scoped to their hostel
  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    hostel_id = hostel.id;
  }

  const rooms = await RoomModel.findAll(hostel_id);
  res.json({ success: true, count: rooms.length, rooms });
}

// GET /api/rooms/available  — All roles
async function getAvailableRooms(req, res) {
  let hostel_id = req.query.hostel_id || null;

  if (req.user.role === 'warden') {
    const hostel = await getWardenHostel(req.user.id);
    hostel_id = hostel.id;
  }

  const rooms = await RoomModel.findAvailable(hostel_id);
  res.json({ success: true, count: rooms.length, rooms });
}

// GET /api/rooms/:id  — All roles
async function getRoomById(req, res) {
  const room = await RoomModel.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  // Wardens: only view rooms in their hostel
  if (req.user.role === 'warden') {
    await assertWardenOwnsHostel(req.user.id, room.hostel_id);
  }

  res.json({ success: true, room });
}

// GET /api/rooms/hostel/:hostelId  — All roles
async function getRoomsByHostel(req, res) {
  const hostel = await HostelModel.findById(req.params.hostelId);
  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  // Wardens: only their hostel
  if (req.user.role === 'warden') {
    await assertWardenOwnsHostel(req.user.id, req.params.hostelId);
  }

  const rooms = await RoomModel.findAll(req.params.hostelId);
  res.json({ success: true, hostel: hostel.name, count: rooms.length, rooms });
}

// PUT /api/rooms/:id  — Admin | Warden (own hostel only)
async function updateRoom(req, res) {
  const room = await RoomModel.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  if (req.user.role === 'warden') {
    await assertWardenOwnsHostel(req.user.id, room.hostel_id);
  }

  const room_number = req.body.room_number !== undefined ? req.body.room_number.trim() : room.room_number;
  const floor       = req.body.floor       !== undefined ? Number(req.body.floor)       : room.floor;
  const type        = req.body.type        !== undefined ? req.body.type                : room.type;
  const capacity    = req.body.capacity    !== undefined ? Number(req.body.capacity)    : room.capacity;
  const status      = req.body.status      !== undefined ? req.body.status              : room.status;

  if (!room_number) {
    return res.status(400).json({ success: false, message: 'room_number cannot be empty' });
  }
  if (capacity < 1) {
    return res.status(400).json({ success: false, message: 'capacity must be at least 1' });
  }
  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  // Cannot reduce capacity below current occupancy
  const occupied = await RoomModel.getOccupiedCount(req.params.id);
  if (capacity < occupied) {
    return res.status(400).json({
      success: false,
      message: `Cannot reduce capacity to ${capacity} — room currently has ${occupied} active occupant(s)`,
    });
  }

  // Duplicate room_number check within same hostel (ignore self)
  if (room_number !== room.room_number) {
    const duplicate = await RoomModel.findByRoomNumber(room.hostel_id, room_number);
    if (duplicate && duplicate.id !== Number(req.params.id)) {
      return res.status(409).json({ success: false, message: `Room "${room_number}" already exists in this hostel` });
    }
  }

  await RoomModel.update(req.params.id, { room_number, floor, type, capacity, status });
  const updated = await RoomModel.findById(req.params.id);
  res.json({ success: true, message: 'Room updated successfully', room: updated });
}

// DELETE /api/rooms/:id  — Admin | Warden (own hostel only)
async function deleteRoom(req, res) {
  const room = await RoomModel.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  if (req.user.role === 'warden') {
    await assertWardenOwnsHostel(req.user.id, room.hostel_id);
  }

  // Block deletion if students are currently occupying the room
  const occupied = await RoomModel.getOccupiedCount(req.params.id);
  if (occupied > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete room — it has ${occupied} active occupant(s). Vacate the room first.`,
    });
  }

  await RoomModel.delete(req.params.id);
  res.json({ success: true, message: 'Room deleted successfully' });
}

module.exports = { createRoom, getAllRooms, getAvailableRooms, getRoomById, getRoomsByHostel, updateRoom, deleteRoom };
