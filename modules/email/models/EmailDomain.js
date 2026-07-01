const mongoose = require('mongoose');

const EmailDomainSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  domain: { type: String, required: true },
  status: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
  spf: { verified: Boolean, record: String, status: String },
  dkim: { verified: Boolean, record: String, selector: String, status: String },
  dmarc: { verified: Boolean, record: String, status: String },
  bounceDomain: String,
  returnPath: String,
  healthScore: { type: Number, default: 0 },
  lastCheckedAt: Date,
  verificationToken: String,
}, { timestamps: true });

EmailDomainSchema.index({ company: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('EmailDomain', EmailDomainSchema);
