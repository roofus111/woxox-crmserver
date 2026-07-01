const mongoose = require('mongoose');

const EncryptedField = { type: String, select: false };

const EmailSettingsSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
  defaultFromName: String,
  defaultFromEmail: String,
  defaultReplyTo: String,
  trackingEnabled: { type: Boolean, default: true },
  openTracking: { type: Boolean, default: true },
  clickTracking: { type: Boolean, default: true },
  unsubscribeLink: { type: Boolean, default: true },
  approvalRequired: { type: Boolean, default: false },
  autosaveInterval: { type: Number, default: 30 },
  rateLimitPerHour: { type: Number, default: 500 },
  notifications: {
    campaignCompleted: { type: Boolean, default: true },
    failedEmail: { type: Boolean, default: true },
    bounce: { type: Boolean, default: true },
    spamComplaint: { type: Boolean, default: true },
    newReply: { type: Boolean, default: true },
    approvalRequired: { type: Boolean, default: true },
  },
  credentials: {
    google: {
      enabled: { type: Boolean, default: false },
      clientId: String,
      clientSecretEncrypted: EncryptedField,
    },
    microsoft: {
      enabled: { type: Boolean, default: false },
      clientId: String,
      clientSecretEncrypted: EncryptedField,
      tenantId: { type: String, default: 'common' },
    },
    smtp: {
      enabled: { type: Boolean, default: false },
      host: String,
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      username: String,
      passwordEncrypted: EncryptedField,
      fromEmail: String,
      fromName: String,
    },
    sendgrid: {
      enabled: { type: Boolean, default: false },
      apiKeyEncrypted: EncryptedField,
    },
    mailgun: {
      enabled: { type: Boolean, default: false },
      apiKeyEncrypted: EncryptedField,
      domain: String,
      region: { type: String, default: 'us' },
    },
    amazonSes: {
      enabled: { type: Boolean, default: false },
      accessKeyEncrypted: EncryptedField,
      secretKeyEncrypted: EncryptedField,
      region: { type: String, default: 'us-east-1' },
    },
    brevo: {
      enabled: { type: Boolean, default: false },
      apiKeyEncrypted: EncryptedField,
    },
    postmark: {
      enabled: { type: Boolean, default: false },
      apiKeyEncrypted: EncryptedField,
    },
    s3: {
      enabled: { type: Boolean, default: false },
      accessKeyEncrypted: EncryptedField,
      secretKeyEncrypted: EncryptedField,
      bucket: String,
      region: String,
    },
  },
  credentialsConfiguredAt: Date,
  credentialsUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailSettings', EmailSettingsSchema);
