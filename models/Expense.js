const mongoose = require('mongoose');

// Define the Expense schema with advanced features
const expenseSchema = new mongoose.Schema({
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model for sales representatives
      required: true,
    },
    category: {
        type: String,
        enum: [
            'Student Counseling Fees', // Charges for counseling or advising services provided to students
            'Marketing and Advertising', // Costs related to promoting the consultancy (ads, flyers, social media)
            'Staff Salaries', // Salaries for employees or contractors
            'Office Rent', // Rent for the office or workspace
            'Travel and Conferences', // Travel expenses for business-related conferences or meetings
            'Legal and Administrative Fees', // Legal services, registration, etc.
            'Technology and Software', // Software subscriptions, website maintenance, tools for operations
            'Training and Development', // Costs associated with staff training and professional development
            'Student Visa Processing', // Fees for processing student visas for clients
            'Partner Institution Commissions', // Commissions paid to partner universities or colleges
            'Office Supplies and Equipment', // Office materials, furniture, and equipment
            'Utilities and Internet', // Utility bills (electricity, water, internet)
            'Leisure and Team Building', // Company retreats, outings, or team-building activities
            'Miscellaneous' // Any other expenses not categorized
          ],
        required: true
      },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive']
    },
    description: {
      type: String,
      maxlength: [500, 'Description can\'t exceed 500 characters'],
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'],
      default: 'Cash'
    },
    receipt: {
      type: String, // URL or file path for receipt (optional)
      default: ''
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project', // Optional reference to another model (e.g., a Project or Campaign model)
      default: null
    },
    recurring: {
      type: Boolean,
      default: false
    },
    recurrenceInterval: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      default: 'Monthly',
      required: function () { return this.recurring; } // Only required if the expense is recurring
    },
    vat: {
      type: Number,
      min: [0, 'VAT must be non-negative'],
      max: [100, 'VAT cannot exceed 100%'],
      default: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'Other'],
      default: 'USD'
    },
    // Refund-related fields
    isRefunded: {
      type: Boolean,
      default: false
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount must be non-negative'],
      default: 0,
      validate: {
        validator: function (value) {
          return value <= this.amount; // Refund amount should not exceed the original expense
        },
        message: 'Refund amount cannot exceed the original expense amount.'
      }
    },
    refundDate: {
      type: Date,
      default: null
    },
    refundReason: {
      type: String,
      maxlength: [500, 'Refund reason can\'t exceed 500 characters'],
      default: ''
    },
    originalExpense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense', // If this is a refund, you can reference the original expense
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Optionally allow virtual fields to be included in JSON output
    toObject: { virtuals: true }
  }
);

// Virtual field to calculate the total amount including VAT, considering refund
expenseSchema.virtual('totalAmount').get(function () {
  const total = this.amount + (this.amount * this.vat / 100);
  if (this.isRefunded) {
    return total - this.refundAmount; // Subtract the refund amount if refunded
  }
  return total;
});

// Create the Expense model
const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
