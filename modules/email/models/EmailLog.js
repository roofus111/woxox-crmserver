const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  action: { type: String, required: true },
  entityType: { type: String, enum: ['email', 'campaign', 'template', 'list', 'segment', 'automation', 'smtp', 'domain', 'settings'] },
  entityId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EmailLogSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
