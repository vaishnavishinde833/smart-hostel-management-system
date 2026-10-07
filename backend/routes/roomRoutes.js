const express = require('express');
const {
  createRoom,
  getAllRooms,
  getAvailableRooms,
  getRoomById,
  getRoomsByHostel,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// GET  /api/rooms/available             — Admin, Warden (own hostel), Student
// Must be before /:id to avoid "available" matching as an id param
router.get('/available', asyncHandler(getAvailableRooms));

// GET  /api/rooms/hostel/:hostelId      — Admin, Warden (own hostel), Student
router.get('/hostel/:hostelId', asyncHandler(getRoomsByHostel));

// POST /api/rooms                       — Admin, Warden (own hostel only)
router.post('/', authorizeRoles('admin', 'warden'), asyncHandler(createRoom));

// GET  /api/rooms                       — Admin, Warden (own hostel), Student
router.get('/', asyncHandler(getAllRooms));

// GET  /api/rooms/:id                   — Admin, Warden (own hostel), Student
router.get('/:id', asyncHandler(getRoomById));

// PUT  /api/rooms/:id                   — Admin, Warden (own hostel only)
router.put('/:id', authorizeRoles('admin', 'warden'), asyncHandler(updateRoom));

// DELETE /api/rooms/:id                 — Admin, Warden (own hostel only)
router.delete('/:id', authorizeRoles('admin', 'warden'), asyncHandler(deleteRoom));

module.exports = router;
