const mongoose = require('mongoose');

const EmailDraftSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  to: [{ email: String, name: String }],
  cc: [{ email: String, name: String }],
  bcc: [{ email: String, name: String }],
  fromName: String,
  fromEmail: String,
  replyTo: String,
  subject: String,
  htmlContent: String,
  textContent: String,
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailAttachment' }],
  autosaveVersion: { type: Number, default: 1 },
  lastAutosavedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('EmailDraft', EmailDraftSchema);
