const { pool } = require('../config/db');

const StudentModel = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, u.phone, u.is_active
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, u.phone, u.is_active
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const [rows] = await pool.query(`
      SELECT s.*, u.name, u.email, u.phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [user_id]);
    return rows[0] || null;
  },

  async findByStudentCode(student_code) {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE student_code = ?',
      [student_code]
    );
    return rows[0] || null;
  },

  async create({ user_id, student_code, course, year, parent_name, parent_phone, address }) {
    const [result] = await pool.query(
      'INSERT INTO students (user_id, student_code, course, year, parent_name, parent_phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, student_code, course, year || 1, parent_name || null, parent_phone || null, address || null]
    );
    return result.insertId;
  },

  async update(id, { course, year, parent_name, parent_phone, address }) {
    const [result] = await pool.query(
      'UPDATE students SET course = ?, year = ?, parent_name = ?, parent_phone = ?, address = ? WHERE id = ?',
      [course, year, parent_name || null, parent_phone || null, address || null, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    // Deleting the linked user cascades to student due to FK
    const [student] = await pool.query('SELECT user_id FROM students WHERE id = ?', [id]);
    if (!student[0]) return false;
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [student[0].user_id]);
    return result.affectedRows > 0;
  },
};

module.exports = StudentModel;
