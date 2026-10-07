const express = require('express');
const {
  createHostel,
  getAllHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
  getMyHostel,
} = require('../controllers/hostelController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// GET  /api/hostels/my  — Warden: their own assigned hostel
// Must be defined before /:id to avoid "my" being treated as an id
router.get('/my', authorizeRoles('warden'), asyncHandler(getMyHostel));

// POST /api/hostels          — Admin only
router.post('/', authorizeRoles('admin'), asyncHandler(createHostel));

// GET  /api/hostels          — Admin, Warden, Student
router.get('/', asyncHandler(getAllHostels));

// GET  /api/hostels/:id      — Admin, Warden, Student
router.get('/:id', asyncHandler(getHostelById));

// PUT  /api/hostels/:id      — Admin (any) | Warden (own only, enforced in controller)
router.put('/:id', authorizeRoles('admin', 'warden'), asyncHandler(updateHostel));

// DELETE /api/hostels/:id    — Admin only
router.delete('/:id', authorizeRoles('admin'), asyncHandler(deleteHostel));

module.exports = router;
