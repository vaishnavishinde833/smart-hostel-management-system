const express = require('express');
const {
  createAllocation,
  getAllAllocations,
  getAllocationById,
  getStudentAllocations,
  getMyAllocation,
  vacateAllocation,
} = require('../controllers/allocationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// GET  /api/allocations/my             — Student only: own current allocation
// Must be before /:id to avoid "my" matching as an id param
router.get('/my', authorizeRoles('student'), asyncHandler(getMyAllocation));

// GET  /api/allocations/student/:studentId  — Admin | Warden (own hostel) | Student (own)
router.get('/student/:studentId', asyncHandler(getStudentAllocations));

// POST /api/allocations                — Admin | Warden (own hostel)
router.post('/', authorizeRoles('admin', 'warden'), asyncHandler(createAllocation));

// GET  /api/allocations                — Admin | Warden (own hostel)
router.get('/', authorizeRoles('admin', 'warden'), asyncHandler(getAllAllocations));

// GET  /api/allocations/:id            — Admin | Warden (own hostel) | Student (own)
router.get('/:id', asyncHandler(getAllocationById));

// PATCH /api/allocations/:id/vacate   — Admin | Warden (own hostel)
router.patch('/:id/vacate', authorizeRoles('admin', 'warden'), asyncHandler(vacateAllocation));

module.exports = router;
