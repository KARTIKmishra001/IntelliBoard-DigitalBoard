const express = require('express');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/assignments
router.get('/', verifyToken, async (req, res) => {
  let filter = {};
  if (req.user.role === 'faculty') filter.createdBy = req.user.id;
  if (req.user.role === 'student') {
    // Get assignments for courses student is enrolled in
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('courses');
    filter.course = { $in: user.courses.map((c) => c._id) };
  }
  if (req.query.course) filter.course = req.query.course;
  const assignments = await Assignment.find(filter)
    .populate('course', 'title code')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(assignments);
});

// POST /api/assignments - faculty/admin create
router.post('/', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const { title, description, course, dueDate, totalPoints, allowedFormats, instructions } = req.body;
  const assignment = await Assignment.create({
    title, description, course, dueDate, totalPoints,
    allowedFormats: allowedFormats || ['pdf', 'docx'],
    instructions: instructions || '',
    createdBy: req.user.id,
  });
  const populated = await Assignment.findById(assignment._id)
    .populate('course', 'title code')
    .populate('createdBy', 'name email');
  res.status(201).json(populated);
});

// GET /api/assignments/:id
router.get('/:id', verifyToken, async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('course', 'title code')
    .populate('createdBy', 'name email')
    .populate({ path: 'submissions', populate: { path: 'student', select: 'name email rollNumber' } });
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  res.json(assignment);
});

// PATCH /api/assignments/:id
router.patch('/:id', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(assignment);
});

// DELETE /api/assignments/:id
router.delete('/:id', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ message: 'Assignment deleted' });
});

// POST /api/assignments/:id/submit - student submission
router.post('/:id/submit', verifyToken, requireRole(['student']), upload.single('file'), async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  const existing = await Submission.findOne({ assignment: req.params.id, student: req.user.id });
  if (existing) return res.status(400).json({ message: 'Already submitted' });

  const submission = await Submission.create({
    assignment: req.params.id,
    student: req.user.id,
    filePath: req.file ? `/uploads/${req.file.filename}` : '',
    fileName: req.file ? req.file.originalname : '',
    status: 'submitted',
  });
  assignment.submissions.push(submission._id);
  await assignment.save();

  res.status(201).json({ message: 'Submitted successfully', submission });
});

// GET /api/assignments/:id/submissions - faculty view
router.get('/:id/submissions', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.id })
    .populate('student', 'name email rollNumber profilePic')
    .sort({ submittedAt: -1 });
  res.json(submissions);
});

// PATCH /api/assignments/submissions/:submissionId/grade - faculty grade
router.patch('/submissions/:submissionId/grade', verifyToken, requireRole(['faculty', 'admin']), async (req, res) => {
  const { grade, feedback } = req.body;
  const submission = await Submission.findByIdAndUpdate(
    req.params.submissionId,
    { grade, feedback, status: 'graded' },
    { new: true }
  ).populate('student', 'name email');
  res.json({ message: 'Graded successfully', submission });
});

module.exports = router;
