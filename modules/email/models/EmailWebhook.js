const mongoose = require('mongoose');

const EmailWebhookSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: [{ type: String, enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed'] }],
  secret: String,
  isActive: { type: Boolean, default: true },
  lastTriggeredAt: Date,
  failureCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailWebhook', EmailWebhookSchema);
