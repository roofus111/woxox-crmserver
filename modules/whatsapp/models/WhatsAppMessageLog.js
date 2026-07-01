const mongoose = require('mongoose');

const WhatsAppMessageLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    direction: { type: String, enum: ['incoming', 'outgoing', 'webhook'], required: true },
    endpoint: { type: String, default: '' },
    method: { type: String, default: 'POST' },
    requestBody: { type: mongoose.Schema.Types.Mixed },
    responseBody: { type: mongoose.Schema.Types.Mixed },
    statusCode: { type: Number },
    responseTimeMs: { type: Number },
    error: { type: String, default: '' },
    retryCount: { type: Number, default: 0 },
    waMessageId: { type: String, default: '' },
  },
  { timestamps: true }
);

WhatsAppMessageLogSchema.index({ company: 1, createdAt: -1 });
WhatsAppMessageLogSchema.index({ direction: 1, createdAt: -1 });

module.exports = mongoose.model('WhatsAppMessageLog', WhatsAppMessageLogSchema);
