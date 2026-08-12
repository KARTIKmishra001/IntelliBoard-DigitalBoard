const express = require('express');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/tests
router.get('/', verifyToken, async (req, res) => {
  let filter = {};
  if (req.user.role === 'faculty') filter.createdBy = req.user.id;
  if (req.user.role === 'student') {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    filter.course = { $in: user.courses };
    filter.isPublished = true;
  }
  if (req.query.course) filter.course = req.query.course;
  const tests = await Test.find(filter)
    .populate('course', 'title code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  // Hide answers for students
  if (req.user.role === 'student') {
    return res.json(tests.map((t) => {
      const obj = t.toObject();
      obj.questions = obj.questions.map(({ correctAnswer: _ca, ...rest }) => rest);
      return obj;
    }));
  }
  res.json(tests);
});

// POST /api/tests - faculty/admin
router.post('/', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const test = await Test.create({ ...req.body, createdBy: req.user.id });
  const populated = await Test.findById(test._id)
    .populate('course', 'title code')
    .populate('createdBy', 'name email');
  res.status(201).json(populated);
});

// GET /api/tests/:id
router.get('/:id', verifyToken, async (req, res) => {
  const test = await Test.findById(req.params.id)
    .populate('course', 'title code')
    .populate('createdBy', 'name email');
  if (!test) return res.status(404).json({ message: 'Test not found' });
  if (req.user.role === 'student') {
    const obj = test.toObject();
    obj.questions = obj.questions.map(({ correctAnswer: _ca, ...rest }) => rest);
    return res.json(obj);
  }
  res.json(test);
});

// PATCH /api/tests/:id
router.patch('/:id', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(test);
});

// DELETE /api/tests/:id
router.delete('/:id', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  res.json({ message: 'Test deleted' });
});

// POST /api/tests/:id/start - student starts attempt
router.post('/:id/start', verifyToken, requireRole(['student']), async (req, res) => {
  const existing = await TestAttempt.findOne({ test: req.params.id, student: req.user.id, status: 'in_progress' });
  if (existing) return res.json(existing);
  const attempt = await TestAttempt.create({
    test: req.params.id,
    student: req.user.id,
    answers: [],
    status: 'in_progress',
  });
  res.status(201).json(attempt);
});

// POST /api/tests/:id/submit - student submits
router.post('/:id/submit', verifyToken, requireRole(['student']), async (req, res) => {
  const { answers, attemptId } = req.body;
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });

  let score = 0;
  const gradedAnswers = answers.map((ans) => {
    const question = test.questions.id(ans.questionId);
    const correct = question && question.correctAnswer === ans.selectedAnswer;
    if (correct) score += question.points || 1;
    return { ...ans, correct };
  });

  const attempt = await TestAttempt.findByIdAndUpdate(
    attemptId,
    { answers: gradedAnswers, score, status: 'submitted', submittedAt: new Date() },
    { new: true }
  ).populate('test', 'title totalPoints');

  res.json({ message: 'Test submitted', attempt, score });
});

// GET /api/tests/:id/attempts - faculty view
router.get('/:id/attempts', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const attempts = await TestAttempt.find({ test: req.params.id })
    .populate('student', 'name email rollNumber')
    .sort({ submittedAt: -1 });
  res.json(attempts);
});

module.exports = router;
