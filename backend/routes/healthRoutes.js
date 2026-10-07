const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET /api/health
router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';

  try {
    const connection = await pool.getConnection();
    connection.release();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    success: true,
    message: 'Server is running',
    server: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
