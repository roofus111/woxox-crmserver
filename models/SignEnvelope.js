const mongoose = require('mongoose')
const crypto = require('crypto')

const AuditSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    actorEmail: String,
    actorName: String,
    ip: String,
    meta: mongoose.Schema.Types.Mixed
  },
  { _id: false }
)

const SignerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  role: { type: String, enum: ['signer', 'cc'], default: 'signer' },
  order: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'sent', 'viewed', 'signed', 'declined'],
    default: 'pending'
  },
  token: { type: String, unique: true, sparse: true },
  signedAt: Date,
  declinedAt: Date,
  declineReason: String,
  viewedAt: Date,
  lastRemindedAt: Date,
  reminderCount: { type: Number, default: 0 },
  ipAddress: String,
  userAgent: String
})

const FieldSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true },
    type: {
      type: String,
      enum: ['signature', 'initials', 'name', 'date', 'text'],
      required: true
    },
    signerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    page: { type: Number, required: true, min: 1 },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    required: { type: Boolean, default: true },
    label: String,
    value: String
  },
  { _id: false }
)

const SignEnvelopeSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'completed', 'declined', 'voided', 'expired'],
      default: 'draft',
      index: true
    },
    document: {
      fileName: String,
      fileType: String,
      fileUrl: String,
      originalName: String,
      pageCount: { type: Number, default: 1 }
    },
    signedDocument: {
      fileName: String,
      fileUrl: String
    },
    signers: [SignerSchema],
    fields: [FieldSchema],
    audit: [AuditSchema],
    signingOrder: { type: Boolean, default: true },
    reminder: {
      enabled: { type: Boolean, default: true },
      intervalDays: { type: Number, default: 3 },
      maxReminders: { type: Number, default: 5 }
    },
    expiresAt: Date,
    sentAt: Date,
    completedAt: Date,
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }
  },
  { timestamps: true }
)

SignEnvelopeSchema.index({ company: 1, status: 1, createdAt: -1 })

SignEnvelopeSchema.statics.newSignerToken = function newSignerToken() {
  return crypto.randomBytes(24).toString('hex')
}

SignEnvelopeSchema.methods.pushAudit = function pushAudit(entry) {
  this.audit.push({
    at: new Date(),
    action: entry.action,
    actorEmail: entry.actorEmail || '',
    actorName: entry.actorName || '',
    ip: entry.ip || '',
    meta: entry.meta || {}
  })
}

module.exports = mongoose.model('SignEnvelope', SignEnvelopeSchema)
