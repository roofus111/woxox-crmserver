const mongoose = require('mongoose');

const WhatsAppChatAssignmentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignmentType: {
      type: String,
      enum: ['manual', 'auto', 'round_robin', 'transfer', 'takeover'],
      default: 'manual',
    },
    previousAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WhatsAppChatAssignmentSchema.index({ conversation: 1, isActive: 1 });

module.exports = mongoose.model('WhatsAppChatAssignment', WhatsAppChatAssignmentSchema);
