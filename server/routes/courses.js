const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/courses
router.get('/', verifyToken, async (req, res) => {
  let filter = {};
  // Students only see their enrolled courses
  if (req.user.role === 'student') filter.students = req.user.id;
  // Faculty & admin see ALL courses (so Create Assignment/Test always has options)
  // Faculty can optionally filter to their own courses with ?mine=true
  if (req.user.role === 'faculty' && req.query.mine === 'true') {
    filter.faculty = req.user.id;
  }
  const courses = await Course.find(filter)
    .populate('faculty', 'name email')
    .populate('students', 'name email rollNumber')
    .sort({ createdAt: -1 });
  res.json(courses);
});


// POST /api/courses - admin/faculty
router.post('/', verifyToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const { title, code, description, faculty } = req.body;
  const course = await Course.create({ title, code, description, faculty: faculty || req.user.id });
  // Add course to faculty's course list
  await User.findByIdAndUpdate(faculty || req.user.id, { $addToSet: { courses: course._id } });
  res.status(201).json(course);
});

// GET /api/courses/:id
router.get('/:id', verifyToken, async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('faculty', 'name email')
    .populate('students', 'name email rollNumber profilePic');
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json(course);
});

// PATCH /api/courses/:id
router.patch('/:id', verifyToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(course);
});

// DELETE /api/courses/:id - admin only
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: 'Course deleted' });
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', verifyToken, requireRole(['admin', 'faculty']), async (req, res) => {
  const { studentId } = req.body;
  await Course.findByIdAndUpdate(req.params.id, { $addToSet: { students: studentId } });
  await User.findByIdAndUpdate(studentId, { $addToSet: { courses: req.params.id } });
  res.json({ message: 'Student enrolled' });
});

module.exports = router;
