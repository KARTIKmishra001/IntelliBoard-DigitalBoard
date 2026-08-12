const mongoose = require('mongoose');
const { ARCHIVE_FILE_TYPES } = require('../config/constants');

const ArchiveSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  title: { type: String, required: true, trim: true },
  fileType: { type: String, enum: ARCHIVE_FILE_TYPES, default: 'png' },
  filePath: { type: String, required: true },
  fileName: { type: String, default: '' },
  tags: [{ type: String, lowercase: true }],
  subject: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnailPath: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Archive', ArchiveSchema);
