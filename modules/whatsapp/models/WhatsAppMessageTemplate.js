const mongoose = require('mongoose');

const WhatsAppMessageTemplateSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    language: { type: String, default: 'en' },
    category: {
      type: String,
      enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
      default: 'UTILITY',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'disabled'],
      default: 'draft',
    },
    headerType: { type: String, enum: ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'], default: 'NONE' },
    headerContent: { type: String, default: '' },
    body: { type: String, required: true },
    footer: { type: String, default: '' },
    buttons: [{ type: mongoose.Schema.Types.Mixed }],
    variables: [{ type: String }],
    metaTemplateId: { type: String, default: '' },
    previewText: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppMessageTemplateSchema.index({ company: 1, name: 1, language: 1 });

module.exports = mongoose.model('WhatsAppMessageTemplate', WhatsAppMessageTemplateSchema);
