const mongoose = require('mongoose');

const WhatsAppContactSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    phone: { type: String, required: true },
    waId: { type: String, required: true },
    name: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    email: { type: String, default: '' },
    country: { type: String, default: '' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    tags: [{ type: String }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isBlocked: { type: Boolean, default: false },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

WhatsAppContactSchema.index({ company: 1, phone: 1 }, { unique: true });
WhatsAppContactSchema.index({ company: 1, waId: 1 });

module.exports = mongoose.model('WhatsAppContact', WhatsAppContactSchema);
