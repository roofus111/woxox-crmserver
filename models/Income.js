const mongoose = require('mongoose');

// Define the Income schema
const incomeSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    // user: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true,
    // },
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
    bankAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other'],
        required: true
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'Other'],
        default: 'USD'
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrenceInterval: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        default: null,
        required: function () { return this.isRecurring; }
    },
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Income = mongoose.model('Income', incomeSchema);

module.exports = Income ;
