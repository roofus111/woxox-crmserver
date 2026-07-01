const mongoose = require('mongoose');

const WhatsAppCampaignSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMessageTemplate' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled'],
      default: 'draft',
    },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      replied: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      roi: { type: Number, default: 0 },
    },
    budget: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppCampaignSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('WhatsAppCampaign', WhatsAppCampaignSchema);
