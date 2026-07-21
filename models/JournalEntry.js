const mongoose = require('mongoose')

const journalLineSchema = new mongoose.Schema(
  {
    ledger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' }
  },
  { _id: true }
)

const journalEntrySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    entryNumber: { type: String, default: '' },
    description: { type: String, required: true, trim: true },
    lines: {
      type: [journalLineSchema],
      validate: {
        validator(lines) {
          if (!lines || lines.length < 2) return false
          const d = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
          const c = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
          return Math.abs(d - c) < 0.01
        },
        message: 'Journal must balance (debits = credits) with at least 2 lines'
      }
    },
    sourceType: {
      type: String,
      enum: ['manual', 'expense', 'income', 'payment', 'invoice', 'opening'],
      default: 'manual'
    },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    paymentMethod: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['draft', 'posted', 'void'], default: 'posted' },
    isVoided: { type: Boolean, default: false },
    voidReason: { type: String, default: '' }
  },
  { timestamps: true }
)

journalEntrySchema.index({ company: 1, date: -1 })
journalEntrySchema.index({ company: 1, sourceType: 1, sourceId: 1 })

module.exports = mongoose.model('JournalEntry', journalEntrySchema)
