const { pool } = require('../config/db');

const RoomModel = {
  async findAll(hostel_id = null) {
    let query = `
      SELECT r.*, h.name AS hostel_name,
             (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.status = 'active') AS occupied_count
      FROM rooms r
      JOIN hostels h ON r.hostel_id = h.id
    `;
    const params = [];
    if (hostel_id) {
      query += ' WHERE r.hostel_id = ?';
      params.push(hostel_id);
    }
    query += ' ORDER BY r.floor, r.room_number';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT r.*, h.name AS hostel_name,
             (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.status = 'active') AS occupied_count
      FROM rooms r
      JOIN hostels h ON r.hostel_id = h.id
      WHERE r.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findAvailable(hostel_id = null) {
    let query = `
      SELECT r.*, h.name AS hostel_name,
             (r.capacity - (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.status = 'active')) AS available_beds
      FROM rooms r
      JOIN hostels h ON r.hostel_id = h.id
      WHERE r.status = 'available'
      HAVING available_beds > 0
    `;
    const params = [];
    if (hostel_id) {
      query = query.replace("WHERE r.status = 'available'", "WHERE r.status = 'available' AND r.hostel_id = ?");
      params.push(hostel_id);
    }
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findByRoomNumber(hostel_id, room_number) {
    const [rows] = await pool.query(
      'SELECT id FROM rooms WHERE hostel_id = ? AND room_number = ?',
      [hostel_id, room_number]
    );
    return rows[0] || null;
  },

  async getOccupiedCount(id) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM allocations WHERE room_id = ? AND status = 'active'",
      [id]
    );
    return rows[0].count;
  },

  async create({ hostel_id, room_number, floor, type, capacity }) {
    const [result] = await pool.query(
      'INSERT INTO rooms (hostel_id, room_number, floor, type, capacity) VALUES (?, ?, ?, ?, ?)',
      [hostel_id, room_number, floor || 0, type || 'double', capacity || 2]
    );
    return result.insertId;
  },

  async update(id, { room_number, floor, type, capacity, status }) {
    const [result] = await pool.query(
      'UPDATE rooms SET room_number = ?, floor = ?, type = ?, capacity = ?, status = ? WHERE id = ?',
      [room_number, floor, type, capacity, status, id]
    );
    return result.affectedRows > 0;
  },

  async updateStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = RoomModel;
