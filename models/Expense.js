const mongoose = require('mongoose');

// Define the Category Schema (Embedded with _id)
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    }
}); // _id is now automatically included for each category

// Define the Expense schema with embedded categories
const expenseSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
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
        type: String,
        default: ''
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    categories: [categorySchema], // Embedded categories with _id
    recurring: {
        type: Boolean,
        default: false
    },
    recurrenceInterval: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        default: null,
        required: function () { return this.recurring; }
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
                return !this.isRefunded || value <= this.amount;
            },
            message: 'Refund amount cannot exceed the original expense amount.'
        }
    },
    refundDate: {
        type: Date,
        default: function () { return this.isRefunded ? Date.now() : null; }
    },
    refundReason: {
        type: String,
        maxlength: [500, 'Refund reason cannot exceed 500 characters'],
        default: '',
        validate: {
            validator: function () {
                return !this.isRefunded || this.refundReason.length > 0;
            },
            message: 'Refund reason is required if expense is refunded.'
        }
    },
    originalExpense: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field to calculate the total amount including VAT, considering refund
expenseSchema.virtual('totalAmount').get(function () {
    let total = this.amount + (this.amount * this.vat / 100);
    return this.isRefunded ? total - this.refundAmount : total;
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = { Expense };
