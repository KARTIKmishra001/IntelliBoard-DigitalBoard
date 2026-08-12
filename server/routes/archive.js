const express = require('express');
const Archive = require('../models/Archive');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/archive
router.get('/', verifyToken, async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.createdBy = req.user.id;
  if (req.query.subject) filter.subject = { $regex: req.query.subject, $options: 'i' };
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
  if (req.query.fileType) filter.fileType = req.query.fileType;
  const archives = await Archive.find(filter)
    .populate('session', 'title subject')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(archives);
});

// POST /api/archive
router.post('/', verifyToken, async (req, res) => {
  const archive = await Archive.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json(archive);
});

// DELETE /api/archive/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const archive = await Archive.findById(req.params.id);
  if (!archive) return res.status(404).json({ message: 'Not found' });
  if (archive.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await archive.deleteOne();
  res.json({ message: 'Deleted' });
});

module.exports = router;
