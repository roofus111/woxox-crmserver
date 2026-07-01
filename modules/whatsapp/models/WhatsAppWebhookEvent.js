const mongoose = require('mongoose');

const WhatsAppWebhookEventSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    signature: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

WhatsAppWebhookEventSchema.index({ company: 1, createdAt: -1 });
WhatsAppWebhookEventSchema.index({ processed: 1, createdAt: 1 });

module.exports = mongoose.model('WhatsAppWebhookEvent', WhatsAppWebhookEventSchema);
