const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  points: { type: Number, default: 1 },
  explanation: { type: String, default: '' },
}, { _id: true });

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [QuestionSchema],
  duration: { type: Number, default: 60 }, // minutes
  startTime: { type: Date },
  endTime: { type: Date },
  totalPoints: { type: Number, default: 0 },
  instructions: { type: String, default: '' },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-calculate totalPoints before save
TestSchema.pre('save', function (next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  next();
});

module.exports = mongoose.model('Test', TestSchema);
