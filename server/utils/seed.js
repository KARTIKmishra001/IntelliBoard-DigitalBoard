require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const Session = require('../models/Session');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing
  await User.deleteMany({});
  await Course.deleteMany({});
  await Session.deleteMany({});

  const hash = (pw) => bcrypt.hash(pw, 12);

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@intelliboard.edu',
    password: await hash('Admin@123'),
    role: 'admin',
    employeeId: 'ADM001',
  });

  // Create faculty
  const faculty1 = await User.create({
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@intelliboard.edu',
    password: await hash('Faculty@123'),
    role: 'faculty',
    employeeId: 'FAC001',
  });
  const faculty2 = await User.create({
    name: 'Prof. Michael Chen',
    email: 'michael.chen@intelliboard.edu',
    password: await hash('Faculty@123'),
    role: 'faculty',
    employeeId: 'FAC002',
  });

  // Create students
  const studentData = [
    { name: 'Alice Thompson', email: 'alice@intelliboard.edu', rollNumber: 'STU001' },
    { name: 'Bob Martinez', email: 'bob@intelliboard.edu', rollNumber: 'STU002' },
    { name: 'Carol Wilson', email: 'carol@intelliboard.edu', rollNumber: 'STU003' },
    { name: 'David Kim', email: 'david@intelliboard.edu', rollNumber: 'STU004' },
    { name: 'Emma Brown', email: 'emma@intelliboard.edu', rollNumber: 'STU005' },
  ];
  const students = await Promise.all(
    studentData.map((s) => User.create({ ...s, password: bcrypt.hashSync('Student@123', 12), role: 'student' }))
  );

  // Create 2 courses
  const course1 = await Course.create({
    title: 'Mathematics 101',
    code: 'MATH101',
    description: 'Fundamentals of mathematics including calculus and linear algebra.',
    faculty: faculty1._id,
    students: students.map((s) => s._id),
  });
  const course2 = await Course.create({
    title: 'Computer Science Fundamentals',
    code: 'CS101',
    description: 'Introduction to algorithms, data structures, and programming paradigms.',
    faculty: faculty2._id,
    students: students.slice(0, 3).map((s) => s._id),
  });

  // Update faculty courses
  await User.findByIdAndUpdate(faculty1._id, { courses: [course1._id] });
  await User.findByIdAndUpdate(faculty2._id, { courses: [course2._id] });

  // Update student courses
  for (const student of students) {
    await User.findByIdAndUpdate(student._id, { courses: [course1._id] });
  }
  for (const student of students.slice(0, 3)) {
    await User.findByIdAndUpdate(student._id, { $addToSet: { courses: course2._id } });
  }

  // Create a demo session
  await Session.create({
    title: 'Introduction to Calculus',
    subject: 'Mathematics',
    course: course1._id,
    createdBy: faculty1._id,
    participants: [faculty1._id, ...students.map((s) => s._id)],
    isActive: true,
  });

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Credentials:');
  console.log('  Admin:   admin@intelliboard.edu / Admin@123');
  console.log('  Faculty: sarah.johnson@intelliboard.edu / Faculty@123');
  console.log('  Faculty: michael.chen@intelliboard.edu / Faculty@123');
  console.log('  Student: alice@intelliboard.edu / Student@123');
  console.log('  (and 4 more students with same password)');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
