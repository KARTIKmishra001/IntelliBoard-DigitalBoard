const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, rollNumber, employeeId } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name, email, password: hashed, role,
    rollNumber: rollNumber || '',
    employeeId: employeeId || '',
  });

  const token = generateToken({ id: user._id, role: user.role, email: user.email });
  res.status(201).json({
    message: 'Registered successfully',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.isActive) return res.status(403).json({ message: 'Account suspended' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = generateToken({ id: user._id, role: user.role, email: user.email });
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePic: user.profilePic },
  });
});

// GET /api/auth/me
const verifyToken = require('../middleware/auth');
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password').populate('courses', 'title code');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
