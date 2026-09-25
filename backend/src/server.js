const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Global Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Base Health-Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount Feature API Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ExamSphere Server running on port ${PORT}`);
});

module.exports = app;
