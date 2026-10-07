const { pool } = require('../config/db');

const NoticeModel = {
  async findAll(target_role = null) {
    let query = `
      SELECT n.*, u.name AS author_name, u.role AS author_role
      FROM notices n
      JOIN users u ON n.author_id = u.id
    `;
    const params = [];
    if (target_role) {
      query += " WHERE n.target_role = 'all' OR n.target_role = ?";
      params.push(target_role);
    }
    query += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT n.*, u.name AS author_name
      FROM notices n
      JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create({ author_id, title, content, target_role }) {
    const [result] = await pool.query(
      'INSERT INTO notices (author_id, title, content, target_role) VALUES (?, ?, ?, ?)',
      [author_id, title, content, target_role || 'all']
    );
    return result.insertId;
  },

  async update(id, { title, content, target_role }) {
    const [result] = await pool.query(
      'UPDATE notices SET title = ?, content = ?, target_role = ? WHERE id = ?',
      [title, content, target_role, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM notices WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = NoticeModel;
