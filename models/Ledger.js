const mongoose = require('mongoose')

const ledgerSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'],
      required: true,
      index: true
    },
    bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', default: null },
    parentLedger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', default: null },
    openingBalance: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
)

ledgerSchema.index({ company: 1, name: 1 }, { unique: true })
ledgerSchema.index({ company: 1, code: 1 })

module.exports = mongoose.model('Ledger', ledgerSchema)
