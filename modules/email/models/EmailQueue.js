const mongoose = require('mongoose');

const EmailQueueSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  email: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailMessage', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
  jobId: String,
  priority: { type: Number, default: 5 },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  scheduledFor: Date,
  processedAt: Date,
  errorMessage: String,
}, { timestamps: true });

EmailQueueSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('EmailQueue', EmailQueueSchema);
