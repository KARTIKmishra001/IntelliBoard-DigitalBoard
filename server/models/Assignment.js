const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  totalPoints: { type: Number, default: 100 },
  allowedFormats: { type: [String], default: ['pdf', 'docx'] },
  instructions: { type: String, default: '' },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }],
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
