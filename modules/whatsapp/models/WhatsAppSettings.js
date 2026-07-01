const mongoose = require('mongoose');

const WhatsAppSettingsSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    metaAppId: { type: String, default: '' },
    metaAppSecret: { type: String, default: '' },
    businessAccountId: { type: String, default: '' },
    phoneNumberId: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    verifyToken: { type: String, default: '' },
    webhookUrl: { type: String, default: '' },
    defaultCountryCode: { type: String, default: '91' },
    autoLeadCreation: { type: Boolean, default: true },
    autoAssignment: { type: Boolean, default: false },
    assignmentMode: {
      type: String,
      enum: ['manual', 'round_robin', 'department'],
      default: 'manual',
    },
    defaultAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    defaultDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    webhookStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    apiConnectionStatus: {
      type: String,
      enum: ['unknown', 'connected', 'disconnected', 'error'],
      default: 'unknown',
    },
    lastConnectionTestAt: { type: Date },
    lastWebhookAt: { type: Date },
    roundRobinIndex: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsAppSettings', WhatsAppSettingsSchema);
