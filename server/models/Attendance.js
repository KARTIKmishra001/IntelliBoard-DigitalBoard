const mongoose = require('mongoose');
const { ATTENDANCE_STATUS, ATTENDANCE_METHOD } = require('../config/constants');

const AttendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.PRESENT,
  },
  markedAt: { type: Date, default: Date.now },
  method: {
    type: String,
    enum: Object.values(ATTENDANCE_METHOD),
    default: ATTENDANCE_METHOD.MANUAL,
  },
  imageCapture: { type: String, default: '' }, // base64 snapshot
  confidence: { type: Number, default: 1.0 },
}, { timestamps: true });

// Prevent duplicate attendance per student per session
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
