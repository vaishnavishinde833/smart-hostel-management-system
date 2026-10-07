const NoticeModel = require('../models/noticeModel');

const VALID_TARGET_ROLES = ['all', 'student', 'warden'];

// ── Controllers ────────────────────────────────────────────────────────────

// POST /api/notices  — Admin | Warden
async function createNotice(req, res) {
  const { title, content, target_role } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'content is required' });
  }
  if (target_role && !VALID_TARGET_ROLES.includes(target_role)) {
    return res.status(400).json({
      success: false,
      message: `target_role must be one of: ${VALID_TARGET_ROLES.join(', ')}`,
    });
  }

  const id = await NoticeModel.create({
    author_id: req.user.id,
    title: title.trim(),
    content: content.trim(),
    target_role: target_role || 'all',
  });

  const notice = await NoticeModel.findById(id);
  res.status(201).json({ success: true, message: 'Notice created successfully', notice });
}

// GET /api/notices  — All roles
// Students see only notices where target_role is 'all' or 'student'
// Wardens see notices where target_role is 'all' or 'warden'
// Admin sees everything (no filter)
async function getAllNotices(req, res) {
  let notices;
  if (req.user.role === 'admin') {
    notices = await NoticeModel.findAll();       // no filter
  } else {
    notices = await NoticeModel.findAll(req.user.role);  // 'student' or 'warden'
  }
  res.json({ success: true, count: notices.length, notices });
}

// GET /api/notices/:id  — All roles (with same visibility filter)
async function getNoticeById(req, res) {
  const notice = await NoticeModel.findById(req.params.id);
  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  // Students cannot see warden-targeted notices
  if (req.user.role === 'student' && notice.target_role === 'warden') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  // Wardens can see all + warden notices; but not pure student-targeted ones?
  // Per spec: wardens see target_role 'all' or 'warden'. Keep same rule.
  if (req.user.role === 'warden' && notice.target_role === 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, notice });
}

// PUT /api/notices/:id  — Admin (any) | Warden (own notices only)
async function updateNotice(req, res) {
  const notice = await NoticeModel.findById(req.params.id);
  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  // Wardens can only edit their own notices
  if (req.user.role === 'warden' && notice.author_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own notices.' });
  }

  const title      = req.body.title      !== undefined ? req.body.title.trim()   : notice.title;
  const content    = req.body.content    !== undefined ? req.body.content.trim() : notice.content;
  const target_role = req.body.target_role !== undefined ? req.body.target_role   : notice.target_role;

  if (!title) {
    return res.status(400).json({ success: false, message: 'title cannot be empty' });
  }
  if (!content) {
    return res.status(400).json({ success: false, message: 'content cannot be empty' });
  }
  if (!VALID_TARGET_ROLES.includes(target_role)) {
    return res.status(400).json({
      success: false,
      message: `target_role must be one of: ${VALID_TARGET_ROLES.join(', ')}`,
    });
  }

  await NoticeModel.update(req.params.id, { title, content, target_role });
  const updated = await NoticeModel.findById(req.params.id);
  res.json({ success: true, message: 'Notice updated successfully', notice: updated });
}

// DELETE /api/notices/:id  — Admin (any) | Warden (own notices only)
async function deleteNotice(req, res) {
  const notice = await NoticeModel.findById(req.params.id);
  if (!notice) {
    return res.status(404).json({ success: false, message: 'Notice not found' });
  }

  if (req.user.role === 'warden' && notice.author_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own notices.' });
  }

  await NoticeModel.delete(req.params.id);
  res.json({ success: true, message: 'Notice deleted successfully' });
}

module.exports = { createNotice, getAllNotices, getNoticeById, updateNotice, deleteNotice };
