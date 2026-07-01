const mongoose = require('mongoose');

const EmailAnalyticsSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', index: true },
  date: { type: Date, required: true, index: true },
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  bounced: { type: Number, default: 0 },
  spam: { type: Number, default: 0 },
  unsubscribed: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  devices: { desktop: Number, mobile: Number, tablet: Number },
  countries: mongoose.Schema.Types.Mixed,
  browsers: mongoose.Schema.Types.Mixed,
  emailClients: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

EmailAnalyticsSchema.index({ company: 1, date: -1 });

module.exports = mongoose.model('EmailAnalytics', EmailAnalyticsSchema);
