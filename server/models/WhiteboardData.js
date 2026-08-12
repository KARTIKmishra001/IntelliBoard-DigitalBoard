const mongoose = require('mongoose');

const WhiteboardDataSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  strokes: [{
    tool: String,
    color: String,
    size: Number,
    points: [{ x: Number, y: Number }],
    timestamp: { type: Date, default: Date.now },
  }],
  snapshots: [{
    dataURL: String,
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('WhiteboardData', WhiteboardDataSchema);
