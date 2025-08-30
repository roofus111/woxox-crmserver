const mongoose = require('mongoose');

// 🔢 SalesCounter Schema - Embedded in the same file
const salesCounterSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ✅ Added: Compound index for company + date uniqueness
salesCounterSchema.index({ company: 1, date: 1 }, { unique: true });

const SalesCounter = mongoose.model('SalesCounter', salesCounterSchema);

//  Main Sales Schema
const salesSchema = new mongoose.Schema({
  salesId: {
    type: String,
    unique: true,
    trim: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    // required: true
  },
  Customer: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Customer'
    },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  invoices: [{ // ✅ Fixed: Changed from 'invoice' to 'invoices' for clarity
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  accepted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000 // ✅ Added: Maximum length for notes
  },
  // ✅ Added: Additional useful fields
  totalAmountPaid: {  
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// 🔄 Pre-save hook to generate salesId
salesSchema.pre('save', async function (next) {
  if (this.salesId) return next(); // Skip if already set (e.g., manual override)

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  try {
    const counter = await SalesCounter.findOneAndUpdate(
      { company: this.company, date: dateStr }, // ✅ Added: Company filter
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const sequence = String(counter.seq).padStart(3, '0');
    this.salesId = `SALE-${dateStr}-${sequence}`;
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Added: Indexes for better query performance
salesSchema.index({ company: 1, status: 1 });
salesSchema.index({ leadId: 1 });
salesSchema.index({ customerId: 1 });
salesSchema.index({ salesId: 1 }, { unique: true });

const Sales = mongoose.model('Sales', salesSchema);
module.exports = Sales;
