const { pool } = require('../config/db');

const UserModel = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    // Returns password hash too — used only for auth
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async create({ name, email, password, role, phone }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, role, phone || null]
    );
    return result.insertId;
  },

  async update(id, { name, phone, is_active }) {
    const [result] = await pool.query(
      'UPDATE users SET name = ?, phone = ?, is_active = ? WHERE id = ?',
      [name, phone || null, is_active, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = UserModel;
