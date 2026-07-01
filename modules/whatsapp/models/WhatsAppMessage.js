const mongoose = require('mongoose');

const WhatsAppMessageSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation', required: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppContact', required: true },
    waMessageId: { type: String, sparse: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    type: {
      type: String,
      enum: [
        'text', 'image', 'video', 'audio', 'voice', 'document', 'pdf',
        'location', 'contact', 'interactive', 'template', 'sticker', 'reaction', 'system',
      ],
      default: 'text',
    },
    content: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    mediaMimeType: { type: String, default: '' },
    mediaFilename: { type: String, default: '' },
    mediaId: { type: String, default: '' },
    mediaFile: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMediaFile' },
    templateName: { type: String, default: '' },
    templateLanguage: { type: String, default: '' },
    templateComponents: { type: mongoose.Schema.Types.Mixed },
    interactivePayload: { type: mongoose.Schema.Types.Mixed },
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      address: String,
    },
    contactCard: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
    },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppMessage' },
    isStarred: { type: Boolean, default: false },
    isInternal: { type: Boolean, default: false },
    broadcast: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppBroadcast' },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCampaign' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

WhatsAppMessageSchema.index({ conversation: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ company: 1, waMessageId: 1 }, { sparse: true });
WhatsAppMessageSchema.index({ company: 1, content: 'text' });

module.exports = mongoose.model('WhatsAppMessage', WhatsAppMessageSchema);
