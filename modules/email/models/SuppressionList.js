const mongoose = require('mongoose');

const SuppressionListSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  reason: { type: String, enum: ['unsubscribe', 'bounce', 'spam', 'manual'], default: 'manual' },
  source: String,
  notes: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

SuppressionListSchema.index({ company: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('EmailSuppressionList', SuppressionListSchema);
