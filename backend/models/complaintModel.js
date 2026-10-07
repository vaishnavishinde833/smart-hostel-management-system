const { pool } = require('../config/db');

const ComplaintModel = {
  async findAll(student_id = null) {
    let query = `
      SELECT c.*, u.name AS student_name, s.student_code
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];
    if (student_id) {
      query += ' WHERE c.student_id = ?';
      params.push(student_id);
    }
    query += ' ORDER BY c.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT c.*, u.name AS student_name, s.student_code
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE c.id = ?
    `, [id]);
    return rows[0] || null;
  },

  // Complaints from students who have (or had) an allocation in a specific hostel
  async findAllByHostel(hostel_id) {
    const [rows] = await pool.query(`
      SELECT DISTINCT c.*, u.name AS student_name, s.student_code
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN allocations a ON a.student_id = s.id
      JOIN rooms r ON a.room_id = r.id
      WHERE r.hostel_id = ?
      ORDER BY c.created_at DESC
    `, [hostel_id]);
    return rows;
  },

  async create({ student_id, category, description }) {
    const [result] = await pool.query(
      'INSERT INTO complaints (student_id, category, description) VALUES (?, ?, ?)',
      [student_id, category || 'other', description]
    );
    return result.insertId;
  },

  async updateStatus(id, { status, response }) {
    const [result] = await pool.query(
      'UPDATE complaints SET status = ?, response = ? WHERE id = ?',
      [status, response || null, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = ComplaintModel;
