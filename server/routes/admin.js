const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Session = require('../models/Session');
const Assignment = require('../models/Assignment');
const Test = require('../models/Test');
const Attendance = require('../models/Attendance');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/admin/stats - system statistics
router.get('/stats', verifyToken, requireRole(['admin']), async (req, res) => {
  const [totalUsers, totalCourses, totalSessions, totalAssignments, totalTests] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Session.countDocuments(),
    Assignment.countDocuments(),
    Test.countDocuments(),
  ]);

  const usersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(10);
  const activeSessions = await Session.countDocuments({ isActive: true });

  res.json({
    totalUsers,
    totalCourses,
    totalSessions,
    totalAssignments,
    totalTests,
    activeSessions,
    usersByRole,
    recentUsers,
  });
});

// GET /api/admin/users - paginated user list
router.get('/users', verifyToken, requireRole(['admin']), async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// POST /api/admin/users - create user
router.post('/users', verifyToken, requireRole(['admin']), async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password || 'Intelliboard@123', 12);
  const user = await User.create({ name, email, password: hashed, role });
  res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
});

module.exports = router;
