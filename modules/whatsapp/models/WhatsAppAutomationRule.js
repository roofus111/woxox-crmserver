const mongoose = require('mongoose');

const WhatsAppAutomationRuleSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    trigger: {
      type: String,
      enum: [
        'lead_created', 'message_received', 'conversation_assigned',
        'status_changed', 'follow_up_due', 'no_reply', 'keyword_match',
      ],
      required: true,
    },
    conditions: [{ type: mongoose.Schema.Types.Mixed }],
    actions: [{
      type: { type: String, enum: [
        'send_template', 'send_message', 'assign_user', 'assign_department',
        'create_task', 'create_followup', 'notify_manager', 'close_lead',
        'update_status', 'run_chatbot', 'delay',
      ]},
      config: { type: mongoose.Schema.Types.Mixed },
      order: { type: Number, default: 0 },
    }],
    priority: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppAutomationRuleSchema.index({ company: 1, isActive: 1, trigger: 1 });

module.exports = mongoose.model('WhatsAppAutomationRule', WhatsAppAutomationRuleSchema);
