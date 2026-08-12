const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/users - admin full access; faculty can list students
router.get('/', verifyToken, async (req, res) => {
  const { role, search, page = 1, limit = 50 } = req.query;

  // Faculty can only list students (needed for attendance)
  if (req.user.role === 'faculty') {
    if (role && role !== 'student') return res.status(403).json({ message: 'Faculty can only list students' });
    const filter = { role: 'student' };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(filter).select('-password').sort({ name: 1 }).limit(Number(limit));
    return res.json({ users, total: users.length });
  }

  // Admin full access
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .populate('courses', 'title code')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});


// GET /api/users/:id
router.get('/:id', verifyToken, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('courses', 'title code');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:id - update profile (handles JSON body OR multipart with file)
const handleProfileUpdate = async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const updates = {};
  if (req.body.name)  updates.name  = req.body.name;
  if (req.body.phone) updates.phone = req.body.phone;
  if (req.file)       updates.profilePic = `/uploads/${req.file.filename}`;

  if (req.body.currentPassword && req.body.newPassword) {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Current password incorrect' });
    updates.password = await bcrypt.hash(req.body.newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  res.json({ message: 'Profile updated', user: updated });
};

// Try JSON first; if content-type is multipart, use multer
router.patch('/:id', verifyToken, (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    upload.single('profilePic')(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      handleProfileUpdate(req, res);
    });
  } else {
    // JSON body — already parsed by express.json()
    handleProfileUpdate(req, res);
  }
});

// DELETE /api/users/:id - admin or self
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

// PATCH /api/users/:id/role - admin only
router.patch('/:id/role', verifyToken, requireRole(['admin']), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'faculty', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  res.json({ message: 'Role updated', user });
});

// PATCH /api/users/:id/toggle-active - admin
router.patch('/:id/toggle-active', verifyToken, requireRole(['admin']), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
});

module.exports = router;
