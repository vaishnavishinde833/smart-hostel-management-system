const express = require('express');
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// POST /api/complaints              — Student only
router.post('/', authorizeRoles('student'), asyncHandler(createComplaint));

// GET  /api/complaints              — All roles (scoped by role in controller)
router.get('/', asyncHandler(getAllComplaints));

// GET  /api/complaints/:id          — All roles (access enforced in controller)
router.get('/:id', asyncHandler(getComplaintById));

// PATCH /api/complaints/:id/status  — Admin | Warden only
router.patch('/:id/status', authorizeRoles('admin', 'warden'), asyncHandler(updateComplaintStatus));

module.exports = router;
