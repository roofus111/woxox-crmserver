const mongoose = require('mongoose');

const EmailAttachmentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  filename: { type: String, required: true },
  originalName: String,
  mimeType: String,
  size: Number,
  s3Key: String,
  s3Url: String,
  virusScanStatus: { type: String, enum: ['pending', 'clean', 'infected', 'skipped'], default: 'pending' },
  compressed: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailAttachment', EmailAttachmentSchema);
