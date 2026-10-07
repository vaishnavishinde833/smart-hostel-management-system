const express = require('express');
const { login, getMe, register } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// POST /api/auth/login
router.post('/login', asyncHandler(login));

// GET /api/auth/me  — requires valid JWT
router.get('/me', protect, asyncHandler(getMe));

// POST /api/auth/register  — admin only
router.post('/register', protect, authorizeRoles('admin'), asyncHandler(register));

module.exports = router;
