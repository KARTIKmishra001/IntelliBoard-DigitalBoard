const express = require('express');
const Session = require('../models/Session');
const WhiteboardData = require('../models/WhiteboardData');
const Archive = require('../models/Archive');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/sessions
router.get('/', verifyToken, async (req, res) => {
  const filter = {};
  // Students can filter to their enrolled sessions with ?enrolled=true
  if (req.user.role === 'student' && req.query.enrolled === 'true') {
    filter.participants = req.user.id;
  }
  // Faculty can filter to their own sessions with ?mine=true
  if (req.user.role === 'faculty' && req.query.mine === 'true') {
    filter.createdBy = req.user.id;
  }
  // Default: all roles see all sessions (needed for attendance marking)
  const sessions = await Session.find(filter)
    .populate('createdBy', 'name email')
    .populate('course', 'title code')
    .sort({ createdAt: -1 });
  res.json(sessions);
});



// POST /api/sessions - faculty/admin create
router.post('/', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const { title, subject, course } = req.body;
  const session = await Session.create({
    title, subject, course: course || null,
    createdBy: req.user.id,
    participants: [req.user.id],
    isActive: true,
  });
  await WhiteboardData.create({ session: session._id, strokes: [], snapshots: [] });
  const populated = await Session.findById(session._id)
    .populate('createdBy', 'name email')
    .populate('course', 'title code');
  res.status(201).json(populated);
});

// GET /api/sessions/:id
router.get('/:id', verifyToken, async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate('createdBy', 'name email profilePic')
    .populate('participants', 'name email profilePic')
    .populate('course', 'title code');
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json(session);
});

// PATCH /api/sessions/:id - update session
router.patch('/:id', verifyToken, async (req, res) => {
  const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(session);
});

// POST /api/sessions/:id/save - save canvas data
router.post('/:id/save', verifyToken, async (req, res) => {
  const { canvasDataURL, strokes } = req.body;
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { canvasData: { dataURL: canvasDataURL, savedAt: new Date() } },
    { new: true }
  );

  // Update whiteboard data
  await WhiteboardData.findOneAndUpdate(
    { session: req.params.id },
    {
      $push: { snapshots: { dataURL: canvasDataURL, savedAt: new Date(), savedBy: req.user.id } },
      ...(strokes && { strokes }),
      lastUpdated: new Date(),
    },
    { upsert: true }
  );

  // Archive automatically
  if (canvasDataURL) {
    await Archive.create({
      session: req.params.id,
      title: session.title || 'Session Archive',
      fileType: 'png',
      filePath: canvasDataURL,
      subject: session.subject || '',
      createdBy: req.user.id,
    });
  }

  res.json({ message: 'Session saved successfully', session });
});

// POST /api/sessions/:id/join
router.post('/:id/join', verifyToken, async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!session.participants.includes(req.user.id)) {
    session.participants.push(req.user.id);
    await session.save();
  }
  res.json({ message: 'Joined session', session });
});

// DELETE /api/sessions/:id - faculty/admin
router.delete('/:id', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.json({ message: 'Session deleted' });
});

module.exports = router;
