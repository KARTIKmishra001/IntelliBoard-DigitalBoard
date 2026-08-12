const mongoose = require('mongoose');
const { TEST_ATTEMPT_STATUS } = require('../config/constants');

const TestAttemptSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedAnswer: { type: String, default: '' },
  }],
  score: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  status: {
    type: String,
    enum: Object.values(TEST_ATTEMPT_STATUS),
    default: TEST_ATTEMPT_STATUS.IN_PROGRESS,
  },
}, { timestamps: true });

module.exports = mongoose.model('TestAttempt', TestAttemptSchema);
