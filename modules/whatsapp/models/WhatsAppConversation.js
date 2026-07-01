const mongoose = require('mongoose');

const WhatsAppConversationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppContact', required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: {
      type: String,
      enum: ['open', 'pending', 'closed', 'archived'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    isPinned: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date },
    lastMessageDirection: { type: String, enum: ['inbound', 'outbound'] },
    lastMessageStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    },
    starredMessageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMessage' }],
    tags: [{ type: String }],
    closedAt: { type: Date },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppConversationSchema.index({ company: 1, contact: 1 });
WhatsAppConversationSchema.index({ company: 1, assignedTo: 1, status: 1 });
WhatsAppConversationSchema.index({ company: 1, lastMessageAt: -1 });
WhatsAppConversationSchema.index({ company: 1, status: 1, isPinned: -1, lastMessageAt: -1 });

module.exports = mongoose.model('WhatsAppConversation', WhatsAppConversationSchema);
