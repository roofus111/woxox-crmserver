const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String },
  category: {
    type: String,
    enum: [
      'Welcome', 'Study Abroad', 'Offer Letter', 'Visa Approved', 'Admission',
      'Payment Reminder', 'Event', 'Newsletter', 'Promotion', 'Holiday',
      'Birthday', 'Anniversary', 'Follow-up', 'Invoice', 'Receipt', 'Thank You',
      'Feedback', 'Referral', 'Abandoned Lead', 'Educational Webinar', 'University Updates', 'Custom',
    ],
    default: 'Custom',
  },
  subject: { type: String, default: '' },
  preheader: { type: String, default: '' },
  htmlContent: { type: String, default: '' },
  mjmlContent: { type: String, default: '' },
  jsonDesign: { type: mongoose.Schema.Types.Mixed, default: {} },
  thumbnail: { type: String },
  tags: [{ type: String }],
  folder: { type: String, default: 'default' },
  isFavorite: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'pending_approval', 'approved', 'rejected', 'published', 'archived'], default: 'draft' },
  version: { type: Number, default: 1 },
  versions: [{
    version: Number,
    htmlContent: String,
    jsonDesign: mongoose.Schema.Types.Mixed,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
}, { timestamps: true });

EmailTemplateSchema.index({ company: 1, category: 1, status: 1 });

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
