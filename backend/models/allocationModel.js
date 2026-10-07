const { pool } = require('../config/db');

const AllocationModel = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT a.*,
             u.name AS student_name, s.student_code,
             r.room_number, h.name AS hostel_name
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN rooms r ON a.room_id = r.id
      JOIN hostels h ON r.hostel_id = h.id
      ORDER BY a.created_at DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT a.*,
             u.name AS student_name, s.student_code,
             r.room_number, h.name AS hostel_name
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN rooms r ON a.room_id = r.id
      JOIN hostels h ON r.hostel_id = h.id
      WHERE a.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findActiveByStudent(student_id) {
    const [rows] = await pool.query(`
      SELECT a.*, r.room_number, h.name AS hostel_name
      FROM allocations a
      JOIN rooms r ON a.room_id = r.id
      JOIN hostels h ON r.hostel_id = h.id
      WHERE a.student_id = ? AND a.status = 'active'
      LIMIT 1
    `, [student_id]);
    return rows[0] || null;
  },

  // All allocations (active + historical) for a given hostel — for warden scope
  async findAllByHostel(hostel_id) {
    const [rows] = await pool.query(`
      SELECT a.*,
             u.name AS student_name, s.student_code,
             r.room_number, h.name AS hostel_name
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN rooms r ON a.room_id = r.id
      JOIN hostels h ON r.hostel_id = h.id
      WHERE r.hostel_id = ?
      ORDER BY a.created_at DESC
    `, [hostel_id]);
    return rows;
  },

  // All allocations (active + historical) for a specific student
  async findAllByStudent(student_id) {
    const [rows] = await pool.query(`
      SELECT a.*, r.room_number, h.name AS hostel_name
      FROM allocations a
      JOIN rooms r ON a.room_id = r.id
      JOIN hostels h ON r.hostel_id = h.id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC
    `, [student_id]);
    return rows;
  },

  async create({ student_id, room_id, allocated_date }) {
    const [result] = await pool.query(
      'INSERT INTO allocations (student_id, room_id, allocated_date) VALUES (?, ?, ?)',
      [student_id, room_id, allocated_date || new Date().toISOString().slice(0, 10)]
    );
    return result.insertId;
  },

  async vacate(id) {
    const today = new Date().toISOString().slice(0, 10);
    const [result] = await pool.query(
      "UPDATE allocations SET status = 'vacated', vacated_date = ? WHERE id = ?",
      [today, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = AllocationModel;
