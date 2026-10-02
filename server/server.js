require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const socketHandlers = require('./socket/socketHandlers');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const assignmentRoutes = require('./routes/assignments');
const testRoutes = require('./routes/tests');
const attendanceRoutes = require('./routes/attendance');
const courseRoutes = require('./routes/courses');
const archiveRoutes = require('./routes/archive');
const adminRoutes = require('./routes/admin');
const aiProxyRoutes = require('./routes/aiProxy');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser / same-origin requests (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // allow all in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

// Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Connect DB
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), service: 'IntelliBoard 360 API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiProxyRoutes);

// Socket.io handlers
socketHandlers(io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 IntelliBoard 360 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🤖 AI Service: ${process.env.PYTHON_AI_URL}`);
});

module.exports = { app, io };
