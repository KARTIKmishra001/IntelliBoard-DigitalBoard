const mongoose = require('mongoose');
const { SUBMISSION_STATUS } = require('../config/constants');

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filePath: { type: String, default: '' },
  fileName: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, default: null },
  feedback: { type: String, default: '' },
  status: {
    type: String,
    enum: Object.values(SUBMISSION_STATUS),
    default: SUBMISSION_STATUS.SUBMITTED,
  },
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
