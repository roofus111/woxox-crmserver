const mongoose = require('mongoose');

const WhatsAppChatbotFlowSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    triggerKeywords: [{ type: String }],
    nodes: [{ type: mongoose.Schema.Types.Mixed }],
    edges: [{ type: mongoose.Schema.Types.Mixed }],
    startNodeId: { type: String, default: '' },
    settings: {
      transferToHumanKeywords: [{ type: String }],
      collectFields: [{ type: String }],
      fallbackMessage: { type: String, default: 'Let me connect you with an agent.' },
    },
    stats: {
      triggered: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      transferred: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppChatbotFlowSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('WhatsAppChatbotFlow', WhatsAppChatbotFlowSchema);
