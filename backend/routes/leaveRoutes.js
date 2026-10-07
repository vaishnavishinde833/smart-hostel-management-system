const express = require('express');
const {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
} = require('../controllers/leaveController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// POST /api/leave-requests                  — Student only
router.post('/', authorizeRoles('student'), asyncHandler(createLeaveRequest));

// GET  /api/leave-requests                  — All roles (scoped in controller)
router.get('/', asyncHandler(getAllLeaveRequests));

// GET  /api/leave-requests/:id              — All roles (access enforced in controller)
router.get('/:id', asyncHandler(getLeaveRequestById));

// PATCH /api/leave-requests/:id/approve     — Admin | Warden
router.patch('/:id/approve', authorizeRoles('admin', 'warden'), asyncHandler(approveLeaveRequest));

// PATCH /api/leave-requests/:id/reject      — Admin | Warden
router.patch('/:id/reject', authorizeRoles('admin', 'warden'), asyncHandler(rejectLeaveRequest));

module.exports = router;
