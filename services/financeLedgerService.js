const Ledger = require('../models/Ledger')
const JournalEntry = require('../models/JournalEntry')

function getCompanyId(user) {
  if (!user?.company) return null
  return user.company._id || user.company
}

const DEFAULT_LEDGERS = [
  { code: '1000', name: 'Cash', type: 'Asset', isSystem: true },
  { code: '1100', name: 'Bank', type: 'Asset', isSystem: true },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset', isSystem: true },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', isSystem: true },
  { code: '2100', name: 'Loans Payable', type: 'Liability', isSystem: true },
  { code: '3000', name: 'Owner Equity', type: 'Equity', isSystem: true },
  { code: '4000', name: 'Sales Income', type: 'Income', isSystem: true },
  { code: '4100', name: 'Other Income', type: 'Income', isSystem: true },
  { code: '5000', name: 'Operating Expenses', type: 'Expense', isSystem: true },
  { code: '5100', name: 'Salaries', type: 'Expense', isSystem: true },
  { code: '5200', name: 'Marketing', type: 'Expense', isSystem: true },
  { code: '5300', name: 'Purchase / COGS', type: 'Expense', isSystem: true }
]

async function ensureDefaultLedgers(companyId, userId) {
  const count = await Ledger.countDocuments({ company: companyId })
  if (count > 0) {
    return Ledger.find({ company: companyId, isActive: true }).sort({ code: 1 })
  }
  await Ledger.insertMany(
    DEFAULT_LEDGERS.map(l => ({
      ...l,
      company: companyId,
      createdBy: userId,
      currency: 'INR',
      openingBalance: 0,
      balance: 0
    }))
  )
  return Ledger.find({ company: companyId, isActive: true }).sort({ code: 1 })
}

async function applyLedgerDeltas(lines, direction = 1) {
  for (const line of lines) {
    const ledger = await Ledger.findById(line.ledger)
    if (!ledger) continue
    const debit = Number(line.debit) || 0
    const credit = Number(line.credit) || 0
    let delta = 0
    if (['Asset', 'Expense'].includes(ledger.type)) {
      delta = (debit - credit) * direction
    } else {
      delta = (credit - debit) * direction
    }
    ledger.balance = Number(((ledger.balance || 0) + delta).toFixed(2))
    await ledger.save()
  }
}

async function nextEntryNumber(companyId) {
  const count = await JournalEntry.countDocuments({ company: companyId })
  return `JE-${String(count + 1).padStart(5, '0')}`
}

async function postJournal({
  companyId,
  userId,
  date,
  description,
  lines,
  sourceType = 'manual',
  sourceId = null,
  paymentMethod = '',
  currency = 'INR',
  status = 'posted'
}) {
  const entry = new JournalEntry({
    company: companyId,
    createdBy: userId,
    date: date || Date.now(),
    entryNumber: await nextEntryNumber(companyId),
    description,
    lines,
    sourceType,
    sourceId,
    paymentMethod,
    currency,
    status
  })
  await entry.save()
  if (status === 'posted') {
    await applyLedgerDeltas(lines, 1)
  }
  return entry
}

async function findLedgerByType(companyId, type, preferredNames = []) {
  for (const name of preferredNames) {
    const found = await Ledger.findOne({ company: companyId, name, isActive: true })
    if (found) return found
  }
  return Ledger.findOne({ company: companyId, type, isActive: true }).sort({ code: 1 })
}

async function postExpenseJournal({ companyId, userId, expense, amount, bankAccountId }) {
  await ensureDefaultLedgers(companyId, userId)
  let cashLedger = null
  if (bankAccountId) {
    cashLedger = await Ledger.findOne({ company: companyId, bankAccountId, isActive: true })
  }
  if (!cashLedger) {
    cashLedger = await findLedgerByType(companyId, 'Asset', ['Bank', 'Cash'])
  }
  const expenseLedger = await findLedgerByType(companyId, 'Expense', [
    'Operating Expenses',
    'Purchase / COGS',
    'Marketing',
    'Salaries'
  ])
  if (!cashLedger || !expenseLedger) return null
  return postJournal({
    companyId,
    userId,
    date: expense.date,
    description: expense.description || 'Expense',
    sourceType: 'expense',
    sourceId: expense._id,
    paymentMethod: expense.paymentMethod || '',
    currency: expense.currency || 'INR',
    lines: [
      { ledger: expenseLedger._id, debit: amount, credit: 0, description: expense.description || '' },
      { ledger: cashLedger._id, debit: 0, credit: amount, description: expense.description || '' }
    ]
  })
}

async function postIncomeJournal({ companyId, userId, income, amount, bankAccountId }) {
  await ensureDefaultLedgers(companyId, userId)
  let cashLedger = null
  if (bankAccountId) {
    cashLedger = await Ledger.findOne({ company: companyId, bankAccountId, isActive: true })
  }
  if (!cashLedger) {
    cashLedger = await findLedgerByType(companyId, 'Asset', ['Bank', 'Cash'])
  }
  const incomeLedger = await findLedgerByType(companyId, 'Income', ['Sales Income', 'Other Income'])
  if (!cashLedger || !incomeLedger) return null
  return postJournal({
    companyId,
    userId,
    date: income.date,
    description: income.description || 'Income',
    sourceType: 'income',
    sourceId: income._id,
    paymentMethod: income.paymentMethod || '',
    currency: income.currency || 'INR',
    lines: [
      { ledger: cashLedger._id, debit: amount, credit: 0, description: income.description || '' },
      { ledger: incomeLedger._id, debit: 0, credit: amount, description: income.description || '' }
    ]
  })
}

async function voidJournalBySource({ companyId, sourceType, sourceId, reason = 'Deleted source' }) {
  const entry = await JournalEntry.findOne({
    company: companyId,
    sourceType,
    sourceId,
    status: 'posted',
    isVoided: false
  })
  if (!entry) return null
  await applyLedgerDeltas(entry.lines, -1)
  entry.status = 'void'
  entry.isVoided = true
  entry.voidReason = reason
  await entry.save()
  return entry
}

module.exports = {
  getCompanyId,
  ensureDefaultLedgers,
  postJournal,
  postExpenseJournal,
  postIncomeJournal,
  voidJournalBySource,
  applyLedgerDeltas,
  findLedgerByType
}
