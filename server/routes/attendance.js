const express = require('express');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/attendance/session/:sessionId
router.get('/session/:sessionId', verifyToken, async (req, res) => {
  const records = await Attendance.find({ session: req.params.sessionId })
    .populate('student', 'name email rollNumber profilePic')
    .sort({ markedAt: -1 });
  res.json(records);
});

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', verifyToken, async (req, res) => {
  if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const records = await Attendance.find({ student: req.params.studentId })
    .populate('session', 'title subject createdAt')
    .populate('course', 'title code')
    .sort({ markedAt: -1 });

  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  res.json({ records, stats: { total, present, absent: total - present, percentage } });
});

// POST /api/attendance/mark
router.post('/mark', verifyToken, async (req, res) => {
  const { student, session, course, status, method, imageCapture, confidence } = req.body;
  try {
    const existing = await Attendance.findOne({ session, student });
    if (existing) return res.status(409).json({ message: 'Already marked', record: existing });
    const record = await Attendance.create({
      student, session, course,
      status: status || 'present',
      method: method || 'face',
      imageCapture: imageCapture || '',
      confidence: confidence || 1.0,
    });
    const populated = await Attendance.findById(record._id).populate('student', 'name email rollNumber');
    res.status(201).json({ message: 'Attendance marked', record: populated });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already marked' });
    throw err;
  }
});

// POST /api/attendance/manual
router.post('/manual', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const { records, sessionId } = req.body;
  const session = await Session.findById(sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  const results = [];
  for (const rec of records) {
    try {
      const existing = await Attendance.findOne({ session: sessionId, student: rec.studentId });
      if (existing) { existing.status = rec.status; existing.method = 'manual'; await existing.save(); results.push(existing); }
      else { const c = await Attendance.create({ session: sessionId, student: rec.studentId, course: session.course, status: rec.status, method: 'manual' }); results.push(c); }
    } catch (_) {}
  }
  res.json({ message: 'Saved', count: results.length });
});

module.exports = router;
