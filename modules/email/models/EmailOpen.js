const mongoose = require('mongoose');

const EmailOpenSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  email: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailMessage', required: true, index: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', index: true },
  openedAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  device: String,
  country: String,
}, { timestamps: true });

module.exports = mongoose.model('EmailOpen', EmailOpenSchema);
