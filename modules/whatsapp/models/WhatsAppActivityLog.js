const mongoose = require('mongoose');

const WhatsAppActivityLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation' },
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMessage' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      enum: [
        'lead_created', 'incoming_message', 'outgoing_message', 'template_sent',
        'media_shared', 'document_shared', 'broadcast_received', 'follow_up_created',
        'task_created', 'call_logged', 'status_updated', 'payment_reminder',
        'visa_reminder', 'admission_update', 'conversation_assigned', 'conversation_transferred',
        'conversation_closed', 'note_added',
      ],
      required: true,
    },
    details: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

WhatsAppActivityLogSchema.index({ company: 1, lead: 1, createdAt: -1 });
WhatsAppActivityLogSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('WhatsAppActivityLog', WhatsAppActivityLogSchema);
