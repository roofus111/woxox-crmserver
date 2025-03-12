const mongoose = require('mongoose');

// Transaction Schema (as a sub-schema)
const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'credit_card'],
    required: true
  },
  reference: String
});

// Add Transaction History Schema
const transactionHistorySchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'modified', 'deleted'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousState: mongoose.Schema.Types.Mixed,
  newState: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Bank Account Schema
const bankAccountSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  accountName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  bankName: {
    type: String,
    required: true
  },
  branchName: String,
  ifscCode: String,
  accountType: {
    type: String,
    enum: ['savings', 'current', 'overdraft'],
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [transactionSchema],
  transactionHistory: [transactionHistorySchema]
}, {
  timestamps: true
});

// Add middleware to update balance before saving
bankAccountSchema.pre('save', function(next) {
  // If this is a new document or transactions were modified
  if (this.isNew || this.isModified('transactions')) {
    this.balance = this.transactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);
  }
  next();
});

// Method to add new transaction
bankAccountSchema.methods.addTransaction = async function(transactionData, userId) {
  const transaction = this.transactions.create(transactionData);
  this.transactions.push(transaction);
  
  // Create history entry
  this.transactionHistory.push({
    transaction: transaction._id,
    action: 'created',
    performedBy: userId,
    newState: transactionData
  });
  
  // Update balance based on transaction type
  if (transactionData.type === 'income') {
    this.balance += transactionData.amount;
  } else {
    this.balance -= transactionData.amount;
  }
  
  return this.save();
};

// Method to calculate current balance
bankAccountSchema.methods.calculateBalance = function() {
  return this.transactions.reduce((balance, transaction) => {
    return transaction.type === 'income' 
      ? balance + transaction.amount 
      : balance - transaction.amount;
  }, 0);
};

// Add indexes for better query performance
bankAccountSchema.index({ accountNumber: 1 });
bankAccountSchema.index({ 'transactions.date': -1 });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;
