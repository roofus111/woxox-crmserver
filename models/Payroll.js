const mongoose = require('mongoose');

// Extra Earnings Schema (Dynamic Categories)
const ExtraEarningSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g., Bonus, Overtime
  amount: { type: Number, required: true }
});

// Deductions Schema (Dynamic Categories)
const DeductionSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g., Loan, LOP, Late Coming
  amount: { type: Number, required: true }
});

// Payment History Schema (For Partial Payments)
const PaymentHistorySchema = new mongoose.Schema({
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other'],
    required: true
  },
});

// Bank Details Schema (Embedded in Payroll)
const BankDetailsSchema = new mongoose.Schema({
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  branchName: { type: String, required: true },
  ifscCode: { type: String, required: true },
  swiftCode: { type: String }, // Optional for international transactions
  upiId: { type: String } // Optional for UPI payments
});

// Main Payroll Schema
const PayrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', 
    required: true 
 },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },

  // Salary Calculation Fields
  monthlySalary: { type: Number, required: true },
  totalWorkingDays: { type: Number, required: true },
  daysWorked: { type: Number, required: true },
  baseSalary: { type: Number, default: 0 },

  // Extra Earnings & Deductions as Arrays
  extraEarnings: [ExtraEarningSchema], // ✅ Embedded inside Payroll
  deductions: [DeductionSchema], // ✅ Embedded inside Payroll

  // Total Amounts from Extra Earnings & Deductions
  totalExtraEarnings: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },

  // Tax & Net Salary Calculation
  tax: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },

  // Payment Tracking
  paidAmount: { type: Number, default: 0 },  // ✅ Tracks total amount paid so far
  remainingSalary: { type: Number, default: function() { return this.netSalary - this.paidAmount; }},  // ✅ Auto-calculated
  paymentDate: { type: Date, required: true },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Half Paid', 'Paid', 'Failed'],
    default: 'Pending'
  },

  // Bank Details Embedded Inside Payroll
  bankDetails: BankDetailsSchema, // ✅ Embedded inside Payroll

  // Payment History as Array
  paymentHistory: [PaymentHistorySchema], // ✅ Stores multiple payments

  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
},

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to Auto-Calculate Salary & Payment Status
PayrollSchema.pre('save', function (next) {
  // Calculate Base Salary based on Days Worked
  if (this.totalWorkingDays > 0) {
    this.baseSalary = (this.monthlySalary / this.totalWorkingDays) * this.daysWorked;
  }

  // Calculate Total Extra Earnings - Handle null/undefined case
  if (Array.isArray(this.extraEarnings)) {
    this.totalExtraEarnings = this.extraEarnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  } else {
    this.totalExtraEarnings = 0;
  }

  // Calculate Total Deductions - Handle null/undefined case
  if (Array.isArray(this.deductions)) {
    this.totalDeductions = this.deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
  } else {
    this.totalDeductions = 0;
  }

  // Calculate Net Salary
  this.netSalary = this.baseSalary + this.totalExtraEarnings - this.totalDeductions - this.tax;

  // Calculate Remaining Salary
  this.remainingSalary = this.netSalary - (this.paidAmount || 0);

  // Auto-Update Payment Status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'Pending';
  } else if (this.paidAmount < this.netSalary) {
    this.paymentStatus = 'Half Paid';
  } else {
    this.paymentStatus = 'Paid';
  }

  this.updatedAt = Date.now();
  next();
});

// Add middleware for updates
PayrollSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate) {
    // Get the update data
    const update = this.getUpdate();
    
    // If extraEarnings or deductions are being updated, recalculate totals
    if (update.extraEarnings) {
      update.totalExtraEarnings = update.extraEarnings.reduce((sum, e) => sum + (e.amount || 0), 0);
    }
    if (update.deductions) {
      update.totalDeductions = update.deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    }

    // Recalculate netSalary if relevant fields are updated
    if (update.extraEarnings || update.deductions || update.tax || update.baseSalary) {
      const baseSalary = update.baseSalary || docToUpdate.baseSalary;
      const totalExtraEarnings = update.totalExtraEarnings || docToUpdate.totalExtraEarnings;
      const totalDeductions = update.totalDeductions || docToUpdate.totalDeductions;
      const tax = update.tax || docToUpdate.tax;
      
      update.netSalary = baseSalary + totalExtraEarnings - totalDeductions - tax;
      update.remainingSalary = update.netSalary - (update.paidAmount || docToUpdate.paidAmount);
    }

    // Update payment status
    const paidAmount = update.paidAmount || docToUpdate.paidAmount;
    const netSalary = update.netSalary || docToUpdate.netSalary;
    
    if (paidAmount === 0) {
      update.paymentStatus = 'Pending';
    } else if (paidAmount < netSalary) {
      update.paymentStatus = 'Half Paid';
    } else {
      update.paymentStatus = 'Paid';
    }

    update.updatedAt = Date.now();
    this.setUpdate(update);
  }
  next();
});

// Export Payroll Model
const Payroll = mongoose.model('Payroll', PayrollSchema);
module.exports = Payroll;
