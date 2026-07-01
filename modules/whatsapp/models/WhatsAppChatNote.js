const mongoose = require('mongoose');

const WhatsAppChatNoteSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['note', 'internal_comment', 'private_note'],
      default: 'note',
    },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

WhatsAppChatNoteSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('WhatsAppChatNote', WhatsAppChatNoteSchema);
