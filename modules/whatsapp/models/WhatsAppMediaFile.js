const mongoose = require('mongoose');

const WhatsAppMediaFileSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    waMediaId: { type: String, default: '' },
    folder: { type: String, default: 'general' },
    tags: [{ type: String }],
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'voice', 'pdf', 'document'],
      default: 'document',
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WhatsAppMediaFileSchema.index({ company: 1, folder: 1 });
WhatsAppMediaFileSchema.index({ company: 1, tags: 1 });

module.exports = mongoose.model('WhatsAppMediaFile', WhatsAppMediaFileSchema);
