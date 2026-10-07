const express = require('express');
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  deactivateStudent,
  activateStudent,
} = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// POST   /api/students          — Admin, Warden
router.post('/', authorizeRoles('admin', 'warden'), asyncHandler(createStudent));

// GET    /api/students          — Admin, Warden
router.get('/', authorizeRoles('admin', 'warden'), asyncHandler(getAllStudents));

// GET    /api/students/:id      — Admin, Warden, Student (own only — enforced in controller)
router.get('/:id', asyncHandler(getStudentById));

// PUT    /api/students/:id      — Admin, Warden
router.put('/:id', authorizeRoles('admin', 'warden'), asyncHandler(updateStudent));

// DELETE /api/students/:id      — Admin only
router.delete('/:id', authorizeRoles('admin'), asyncHandler(deleteStudent));

// PATCH  /api/students/:id/deactivate  — Admin, Warden
router.patch('/:id/deactivate', authorizeRoles('admin', 'warden'), asyncHandler(deactivateStudent));

// PATCH  /api/students/:id/activate    — Admin, Warden
router.patch('/:id/activate', authorizeRoles('admin', 'warden'), asyncHandler(activateStudent));

module.exports = router;
