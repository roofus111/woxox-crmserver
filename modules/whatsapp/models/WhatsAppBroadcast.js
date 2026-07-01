const mongoose = require('mongoose');

const WhatsAppBroadcastSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMessageTemplate' },
    message: { type: String, default: '' },
    messageType: { type: String, enum: ['template', 'text'], default: 'template' },
    filters: {
      leadStatus: [{ type: String }],
      country: [{ type: String }],
      course: [{ type: String }],
      intake: [{ type: String }],
      university: [{ type: String }],
      assignedCounselor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      tags: [{ type: String }],
      customQuery: { type: mongoose.Schema.Types.Mixed },
    },
    recipientCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'draft',
    },
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
    },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCampaign' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppBroadcastSchema.index({ company: 1, status: 1, scheduledAt: 1 });

module.exports = mongoose.model('WhatsAppBroadcast', WhatsAppBroadcastSchema);
