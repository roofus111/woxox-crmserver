const mongoose = require('mongoose');

const EmailClickSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  email: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailMessage', required: true, index: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign', index: true },
  url: { type: String, required: true },
  linkId: String,
  heatmapZone: { type: String, enum: ['top', 'middle', 'bottom', 'unknown'], default: 'unknown' },
  clickedAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  device: String,
  country: String,
}, { timestamps: true });

module.exports = mongoose.model('EmailClick', EmailClickSchema);
