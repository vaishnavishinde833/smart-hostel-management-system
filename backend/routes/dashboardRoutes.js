const express = require('express');
const { adminDashboard, wardenDashboard, studentDashboard } = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.use(protect);

// GET /api/dashboard/admin    — Admin only
router.get('/admin',   authorizeRoles('admin'),   asyncHandler(adminDashboard));

// GET /api/dashboard/warden   — Warden only
router.get('/warden',  authorizeRoles('warden'),  asyncHandler(wardenDashboard));

// GET /api/dashboard/student  — Student only
router.get('/student', authorizeRoles('student'), asyncHandler(studentDashboard));

module.exports = router;
