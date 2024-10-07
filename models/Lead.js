const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true  },
  campaign: { type: String },
  status: { type: String, enum: ['New', 'Contacted','Interested','Not Interested', 'Converted','Pending','In Progress', 'Lost', 'Won'], default: 'New' },
  source: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // This specifies that the default value can be null.
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
