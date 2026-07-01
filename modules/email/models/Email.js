const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', index: true },
  threadId: { type: String, index: true },
  messageId: { type: String, unique: true, sparse: true },
  direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
  to: [{ email: String, name: String }],
  cc: [{ email: String, name: String }],
  bcc: [{ email: String, name: String }],
  from: { email: String, name: String },
  replyTo: String,
  subject: String,
  preheader: String,
  htmlContent: String,
  textContent: String,
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
  contactEmail: { type: String, index: true },
  status: {
    type: String,
    enum: ['draft', 'queued', 'scheduled', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'spam', 'unsubscribed'],
    default: 'draft',
  },
  folder: { type: String, enum: ['inbox', 'sent', 'draft', 'scheduled', 'archive', 'trash'], default: 'sent' },
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  labels: [{ type: String }],
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailAttachment' }],
  smtpAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailSMTPAccount' },
  scheduledAt: Date,
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  errorMessage: String,
  trackingId: { type: String, index: true },
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

EmailSchema.index({ company: 1, folder: 1, createdAt: -1 });
EmailSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('EmailMessage', EmailSchema);
