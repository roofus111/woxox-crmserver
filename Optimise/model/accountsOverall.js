const mongoose = require('mongoose');

const categoryBreakdownSchema = new mongoose.Schema({
  name: { type: String, required: true },
  total: { type: Number, required: true },
  count: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true }
}, { timestamps: true }); // timestamps + _id: true by default

const monthlyTrendSchema = new mongoose.Schema({
  month: { type: String, required: true }, // format: "MM/YYYY"
  income: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 }
}, { timestamps: true });

const overallSummarySchema = new mongoose.Schema({
  totalAccounts: Number,
  totalBalance: Number,
  totalTransactions: Number,
  totalIncome: Number,
  totalExpenses: Number,
  netCashflow: Number
}, { timestamps: true });

const accountMetricsSchema = new mongoose.Schema({
  averageAccountBalance: Number,
  accountWithHighestBalance: {
    id: { type: String },
    balance: Number
  },
  accountWithMostTransactions: {
    id: { type: String },
    count: Number
  }
}, { timestamps: true });

const overallMetricsSchema = new mongoose.Schema({
  averageTransactionSize: Number,
  incomeToExpenseRatio: Number,
  mostUsedPaymentMethod: String,
  topCategory: String
}, { timestamps: true });

const financialSummarySchema = new mongoose.Schema({
  overallSummary: overallSummarySchema,
  accountMetrics: accountMetricsSchema,
  categoryBreakdown: { type: Map, of: categoryBreakdownSchema },
  monthlyTrends: { type: Map, of: monthlyTrendSchema },
  overallMetrics: overallMetricsSchema
}, { timestamps: true });

module.exports = mongoose.model('FinancialSummary', financialSummarySchema);
