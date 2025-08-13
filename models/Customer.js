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
  payment: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: { 
      type: String, 
      enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'],  
      default: 'Pending' 
    },
    dueDate: { type: Date },
    paidDate: { type: Date }
  },
  
  // Purchase and Payment Tracking
  purchaseHistory: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ProductService', 
      required: true 
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
    invoiceNumber: { type: String },
    status: { 
      type: String, 
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], 
      default: 'Pending' 
    }
  }],
  
  // Financial Summary
  financialSummary: {
    totalPurchases: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    lastPaymentDate: { type: Date },
    lastPurchaseDate: { type: Date }
  },
  
  // Payment History
  paymentHistory: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { 
      type: String, 
      enum: ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other'] 
    },
    referenceNumber: { type: String },
    notes: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Activity tracking
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
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

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
