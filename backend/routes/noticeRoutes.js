const express = require('express');
const {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// POST   /api/notices       — Admin | Warden
router.post('/', authorizeRoles('admin', 'warden'), asyncHandler(createNotice));

// GET    /api/notices       — All roles (visibility filtered by role)
router.get('/', asyncHandler(getAllNotices));

// GET    /api/notices/:id   — All roles (visibility filtered by role)
router.get('/:id', asyncHandler(getNoticeById));

// PUT    /api/notices/:id   — Admin (any) | Warden (own only)
router.put('/:id', authorizeRoles('admin', 'warden'), asyncHandler(updateNotice));

// DELETE /api/notices/:id   — Admin (any) | Warden (own only)
router.delete('/:id', authorizeRoles('admin', 'warden'), asyncHandler(deleteNotice));

module.exports = router;
