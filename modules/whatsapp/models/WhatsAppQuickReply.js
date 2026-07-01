const mongoose = require('mongoose');

const WhatsAppQuickReplySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Greeting', 'Admission', 'Scholarship', 'Visa', 'Course',
        'Fees', 'Document', 'Appointment', 'Closing', 'General',
      ],
      default: 'General',
    },
    variables: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppQuickReplySchema.index({ company: 1, category: 1 });
WhatsAppQuickReplySchema.index({ company: 1, title: 'text', content: 'text' });

module.exports = mongoose.model('WhatsAppQuickReply', WhatsAppQuickReplySchema);
