const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  email: { type: String, required: true },
  firstName: String,
  lastName: String,
  phone: String,
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['active', 'unsubscribed', 'bounced'], default: 'active' },
});

const EmailContactListSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['static', 'dynamic'], default: 'static' },
  description: String,
  contacts: [ContactSchema],
  dynamicRules: mongoose.Schema.Types.Mixed,
  contactCount: { type: Number, default: 0 },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailContactList', EmailContactListSchema);
