const mongoose = require('mongoose')

const ImpersonationHandoffSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorEmail: { type: String },
  reason: { type: String },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

ImpersonationHandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('ImpersonationHandoff', ImpersonationHandoffSchema)
