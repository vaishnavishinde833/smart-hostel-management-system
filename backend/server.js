require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes    = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const hostelRoutes  = require('./routes/hostelRoutes');
const roomRoutes       = require('./routes/roomRoutes');
const allocationRoutes  = require('./routes/allocationRoutes');
const complaintRoutes   = require('./routes/complaintRoutes');
const leaveRoutes       = require('./routes/leaveRoutes');
const noticeRoutes      = require('./routes/noticeRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/hostels',  hostelRoutes);
app.use('/api/rooms',       roomRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/complaints',    complaintRoutes);
app.use('/api/leave-requests', leaveRoutes);
app.use('/api/notices',        noticeRoutes);
app.use('/api/dashboard',      dashboardRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler (must be last)
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

startServer();
