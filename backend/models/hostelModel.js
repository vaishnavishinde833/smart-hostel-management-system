const { pool } = require('../config/db');

const HostelModel = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT h.*, u.name AS warden_name
      FROM hostels h
      LEFT JOIN users u ON h.warden_id = u.id
      ORDER BY h.created_at DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT h.*, u.name AS warden_name
      FROM hostels h
      LEFT JOIN users u ON h.warden_id = u.id
      WHERE h.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByName(name) {
    const [rows] = await pool.query('SELECT id FROM hostels WHERE name = ?', [name]);
    return rows[0] || null;
  },

  async findByWardenId(warden_id) {
    const [rows] = await pool.query(`
      SELECT h.*, u.name AS warden_name
      FROM hostels h
      LEFT JOIN users u ON h.warden_id = u.id
      WHERE h.warden_id = ?
    `, [warden_id]);
    return rows[0] || null;
  },

  async create({ name, address, warden_id }) {
    const [result] = await pool.query(
      'INSERT INTO hostels (name, address, warden_id) VALUES (?, ?, ?)',
      [name, address || null, warden_id || null]
    );
    return result.insertId;
  },

  async update(id, { name, address, warden_id }) {
    const [result] = await pool.query(
      'UPDATE hostels SET name = ?, address = ?, warden_id = ? WHERE id = ?',
      [name, address || null, warden_id || null, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM hostels WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = HostelModel;
