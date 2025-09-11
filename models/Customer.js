const mongoose = require('mongoose');

// Activity log sub-schema for tracking customer activities
const customerActivitySchema = new mongoose.Schema({
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true,
    enum: [
      'created', 
      'updated', 
      'status_change', 
      'note_added', 
      'assigned', 
      'deleted',
      'contacted',
      'follow_up',
      'converted_to_lead',
      'archived',
      'restored'
    ]
  },
  details: { 
    type: String, 
    required: false 
  },
  performedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const customerSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  firstName: { type: String, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  qualification: { type: String, trim: true },
  occupation: { type: String },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true }  
  },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  
  // Enhanced enums for customer management
  customerType: { 
    type: String, 
    enum: ['Prospect', 'Regular', 'VIP', 'Wholesale', 'Retail'], 
    default: 'Prospect' 
  },
  source: { 
    type: String, 
    enum: ['Website', 'Referral', 'Social Media', 'Advertisement', 'Cold Call', 'Trade Show', 'Other'], 
    default: 'Other' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Archived', 'Converted'], 
    default: 'Active' 
  }, 
  
  // New fields
  handledby: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, 
  receivedDate: { 
    type: Date, 
    default: Date.now 
  }, 
  
  // Purchase, Payment, Lead and Document references 
  purchase: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductService' }],
  payment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  lead: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
  document: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  
  // Activity tracking
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Activity log
  activityLog: [customerActivitySchema],
  
  notes: { type: String, trim: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for efficient querying 
customerSchema.index({ company: 1, status: 1 });
customerSchema.index({ company: 1, createdBy: 1 });
customerSchema.index({ company: 1, assignedTo: 1 });
customerSchema.index({ company: 1, purchase: 1 });
customerSchema.index({ company: 1, payment: 1 });
customerSchema.index({ company: 1, lead: 1 });
customerSchema.index({ company: 1, document: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
