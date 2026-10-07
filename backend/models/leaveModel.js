const { pool } = require('../config/db');

const LeaveModel = {
  async findAll(student_id = null) {
    let query = `
      SELECT l.*, u.name AS student_name, s.student_code,
             wu.name AS approved_by_name
      FROM leave_requests l
      JOIN students s ON l.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users wu ON l.approved_by = wu.id
    `;
    const params = [];
    if (student_id) {
      query += ' WHERE l.student_id = ?';
      params.push(student_id);
    }
    query += ' ORDER BY l.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT l.*, u.name AS student_name, s.student_code,
             wu.name AS approved_by_name
      FROM leave_requests l
      JOIN students s ON l.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users wu ON l.approved_by = wu.id
      WHERE l.id = ?
    `, [id]);
    return rows[0] || null;
  },

  // Leave requests for students allocated to a specific hostel
  async findAllByHostel(hostel_id) {
    const [rows] = await pool.query(`
      SELECT DISTINCT l.*, u.name AS student_name, s.student_code,
             wu.name AS approved_by_name
      FROM leave_requests l
      JOIN students s ON l.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users wu ON l.approved_by = wu.id
      JOIN allocations a ON a.student_id = s.id
      JOIN rooms r ON a.room_id = r.id
      WHERE r.hostel_id = ?
      ORDER BY l.created_at DESC
    `, [hostel_id]);
    return rows;
  },

  // Find overlapping active (pending or approved) leave for a student
  // Overlap: existing [from, to] intersects new [new_from, new_to]
  async findOverlapping(student_id, from_date, to_date, exclude_id = null) {
    let query = `
      SELECT id FROM leave_requests
      WHERE student_id = ?
        AND status IN ('pending', 'approved')
        AND from_date <= ?
        AND to_date >= ?
    `;
    const params = [student_id, to_date, from_date];
    if (exclude_id) {
      query += ' AND id != ?';
      params.push(exclude_id);
    }
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async create({ student_id, from_date, to_date, reason }) {
    const [result] = await pool.query(
      'INSERT INTO leave_requests (student_id, from_date, to_date, reason) VALUES (?, ?, ?, ?)',
      [student_id, from_date, to_date, reason]
    );
    return result.insertId;
  },

  async updateStatus(id, { status, approved_by, remarks }) {
    const [result] = await pool.query(
      'UPDATE leave_requests SET status = ?, approved_by = ?, remarks = ? WHERE id = ?',
      [status, approved_by || null, remarks || null, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = LeaveModel;
