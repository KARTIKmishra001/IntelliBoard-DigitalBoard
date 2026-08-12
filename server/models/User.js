const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(ROLES), required: true, default: ROLES.STUDENT },
  profilePic: { type: String, default: '' },
  rollNumber: { type: String, default: '' },    // for students
  employeeId: { type: String, default: '' },    // for faculty
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  faceEncoding: { type: String, default: '' },  // base64 JSON face encoding
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
