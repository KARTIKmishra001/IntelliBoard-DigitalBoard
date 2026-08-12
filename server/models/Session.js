const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  canvasData: { type: mongoose.Schema.Types.Mixed, default: null }, // JSON snapshot
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
