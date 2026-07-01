const mongoose = require('mongoose');

const EmailCampaignSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['regular', 'drip', 'newsletter', 'transactional', 'automation', 'rss', 'ab_test', 'recurring'],
    default: 'regular',
  },
  subject: { type: String, required: true },
  preheader: { type: String, default: '' },
  fromName: { type: String, default: '' },
  fromEmail: { type: String, default: '' },
  replyTo: { type: String, default: '' },
  htmlContent: { type: String, default: '' },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  listIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailContactList' }],
  segmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailSegment' }],
  smtpAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailSMTPAccount' },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled', 'archived', 'failed'],
    default: 'draft',
  },
  schedule: {
    sendAt: Date,
    timezone: { type: String, default: 'UTC' },
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
      interval: { type: Number, default: 1 },
      endDate: Date,
    },
    bestTimeOptimization: { type: Boolean, default: false },
  },
  tracking: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
    customParams: mongoose.Schema.Types.Mixed,
  },
  abTest: {
    enabled: { type: Boolean, default: false },
    variants: [{ subject: String, htmlContent: String, percentage: Number }],
    winnerCriteria: { type: String, enum: ['open_rate', 'click_rate'], default: 'open_rate' },
    phase: { type: String, enum: ['testing', 'winner_sent', 'completed'], default: 'testing' },
    testSamplePercent: { type: Number, default: 20 },
    testDurationHours: { type: Number, default: 4 },
    testStartedAt: Date,
    winnerVariantIndex: Number,
    winnerSelectedAt: Date,
    holdbackRecipients: [String],
    variantStats: [{ sent: Number, opened: Number, clicked: Number }],
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    spam: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

EmailCampaignSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('EmailCampaign', EmailCampaignSchema);
