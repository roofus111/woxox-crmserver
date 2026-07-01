const mongoose = require('mongoose');

const EmailEventSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  email: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailMessage', index: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', index: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
  type: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed', 'replied', 'forwarded', 'downloaded', 'failed'],
    required: true,
  },
  metadata: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  device: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
  browser: String,
  os: String,
  country: String,
  city: String,
}, { timestamps: true });

EmailEventSchema.index({ company: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('EmailEvent', EmailEventSchema);
