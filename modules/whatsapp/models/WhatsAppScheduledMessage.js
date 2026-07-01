const mongoose = require('mongoose');

const WhatsAppScheduledMessageSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation' },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppContact' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    messageType: { type: String, enum: ['text', 'template'], default: 'text' },
    content: { type: String, default: '' },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMessageTemplate' },
    templateVariables: { type: mongoose.Schema.Types.Mixed },
    scheduleType: {
      type: String,
      enum: ['one_time', 'recurring', 'birthday', 'fee_reminder', 'visa_reminder', 'offer_reminder', 'interview_reminder'],
      default: 'one_time',
    },
    scheduledAt: { type: Date, required: true },
    recurrence: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
      interval: { type: Number, default: 1 },
      endDate: { type: Date },
    },
    status: {
      type: String,
      enum: ['scheduled', 'processing', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

WhatsAppScheduledMessageSchema.index({ company: 1, status: 1, scheduledAt: 1 });

module.exports = mongoose.model('WhatsAppScheduledMessage', WhatsAppScheduledMessageSchema);
