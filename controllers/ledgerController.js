const Ledger = require('../models/Ledger')
const JournalEntry = require('../models/JournalEntry')
const { Expense } = require('../models/Expense')
const Income = require('../models/Income')
const {
  getCompanyId,
  ensureDefaultLedgers,
  postJournal,
  applyLedgerDeltas
} = require('../services/financeLedgerService')

exports.listLedgers = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    if (!companyId) return res.status(400).json({ message: 'Company not found on user' })
    const ledgers = await ensureDefaultLedgers(companyId, req.user._id)
    res.json({ data: ledgers })
  } catch (error) {
    console.error('listLedgers', error)
    res.status(500).json({ message: 'Failed to list ledgers', error: error.message })
  }
}

exports.createLedger = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    const { name, code, type, bankAccountId, openingBalance, currency, notes } = req.body
    if (!name || !type) {
      return res.status(400).json({ message: 'name and type are required' })
    }

    await ensureDefaultLedgers(companyId, req.user._id)

    const ledger = await Ledger.create({
      company: companyId,
      name,
      code: code || '',
      type,
      bankAccountId: bankAccountId || null,
      openingBalance: Number(openingBalance) || 0,
      balance: Number(openingBalance) || 0,
      currency: currency || 'INR',
      notes: notes || '',
      createdBy: req.user._id
    })

    if (Number(openingBalance)) {
      const equity = await Ledger.findOne({ company: companyId, type: 'Equity', isActive: true })
      if (equity) {
        const amt = Math.abs(Number(openingBalance))
        const isDebitAsset = ['Asset', 'Expense'].includes(type) && Number(openingBalance) >= 0
        await postJournal({
          companyId,
          userId: req.user._id,
          description: `Opening balance · ${name}`,
          sourceType: 'opening',
          sourceId: ledger._id,
          lines: isDebitAsset
            ? [
                { ledger: ledger._id, debit: amt, credit: 0 },
                { ledger: equity._id, debit: 0, credit: amt }
              ]
            : [
                { ledger: equity._id, debit: amt, credit: 0 },
                { ledger: ledger._id, debit: 0, credit: amt }
              ]
        })
        const refreshed = await Ledger.findById(ledger._id)
        return res.status(201).json({ message: 'Ledger created', data: refreshed })
      }
    }

    res.status(201).json({ message: 'Ledger created', data: ledger })
  } catch (error) {
    console.error('createLedger', error)
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ledger name already exists for this company' })
    }
    res.status(500).json({ message: 'Failed to create ledger', error: error.message })
  }
}

exports.getLedgerById = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    const ledger = await Ledger.findOne({ _id: req.params.id, company: companyId })
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' })

    const entries = await JournalEntry.find({
      company: companyId,
      status: 'posted',
      isVoided: false,
      'lines.ledger': ledger._id
    })
      .sort({ date: -1 })
      .populate('createdBy', 'name email')
      .limit(200)

    const transactions = []
    for (const entry of entries) {
      for (const line of entry.lines) {
        if (String(line.ledger) !== String(ledger._id)) continue
        transactions.push({
          id: `${entry._id}-${line._id}`,
          entryId: entry._id,
          entryNumber: entry.entryNumber,
          date: entry.date,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
          sourceType: entry.sourceType,
          paymentMethod: entry.paymentMethod
        })
      }
    }

    res.json({ data: { ledger, transactions } })
  } catch (error) {
    console.error('getLedgerById', error)
    res.status(500).json({ message: 'Failed to fetch ledger', error: error.message })
  }
}

exports.updateLedger = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    const ledger = await Ledger.findOne({ _id: req.params.id, company: companyId })
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' })

    const { name, code, type, bankAccountId, notes, isActive, currency } = req.body
    if (name) ledger.name = name
    if (code !== undefined) ledger.code = code
    if (type) ledger.type = type
    if (bankAccountId !== undefined) ledger.bankAccountId = bankAccountId || null
    if (notes !== undefined) ledger.notes = notes
    if (currency) ledger.currency = currency
    if (isActive !== undefined) ledger.isActive = isActive

    await ledger.save()
    res.json({ message: 'Ledger updated', data: ledger })
  } catch (error) {
    console.error('updateLedger', error)
    res.status(500).json({ message: 'Failed to update ledger', error: error.message })
  }
}

exports.listJournals = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    const { ledgerId, type, from, to } = req.query
    const query = { company: companyId, status: 'posted', isVoided: false }

    if (ledgerId) query['lines.ledger'] = ledgerId
    if (type) query.sourceType = type
    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from)
      if (to) query.date.$lte = new Date(to)
    }

    const entries = await JournalEntry.find(query)
      .sort({ date: -1 })
      .populate('lines.ledger', 'name code type')
      .populate('createdBy', 'name email')
      .limit(300)

    res.json({ data: entries })
  } catch (error) {
    console.error('listJournals', error)
    res.status(500).json({ message: 'Failed to list journals', error: error.message })
  }
}

exports.createJournal = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    const { date, description, lines, paymentMethod, currency } = req.body
    if (!description || !Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({ message: 'description and at least 2 lines required' })
    }

    await ensureDefaultLedgers(companyId, req.user._id)
    const entry = await postJournal({
      companyId,
      userId: req.user._id,
      date,
      description,
      lines,
      paymentMethod: paymentMethod || '',
      currency: currency || 'INR',
      sourceType: 'manual'
    })

    const populated = await JournalEntry.findById(entry._id).populate('lines.ledger', 'name code type')
    res.status(201).json({ message: 'Journal posted', data: populated })
  } catch (error) {
    console.error('createJournal', error)
    res.status(400).json({ message: error.message || 'Failed to post journal' })
  }
}

exports.voidJournal = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    const entry = await JournalEntry.findOne({ _id: req.params.id, company: companyId })
    if (!entry) return res.status(404).json({ message: 'Journal not found' })
    if (entry.isVoided) return res.status(400).json({ message: 'Already voided' })

    await applyLedgerDeltas(entry.lines, -1)
    entry.status = 'void'
    entry.isVoided = true
    entry.voidReason = req.body.reason || 'Manual void'
    await entry.save()
    res.json({ message: 'Journal voided', data: entry })
  } catch (error) {
    console.error('voidJournal', error)
    res.status(500).json({ message: 'Failed to void journal', error: error.message })
  }
}

exports.getBalanceSheet = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    await ensureDefaultLedgers(companyId, req.user._id)
    const ledgers = await Ledger.find({ company: companyId, isActive: true }).sort({ code: 1 })

    const assets = ledgers
      .filter(l => l.type === 'Asset')
      .map(l => ({ name: l.name, code: l.code, value: l.balance, id: l._id }))
    const liabilities = ledgers
      .filter(l => l.type === 'Liability')
      .map(l => ({ name: l.name, code: l.code, value: l.balance, id: l._id }))
    const equity = ledgers
      .filter(l => l.type === 'Equity')
      .map(l => ({ name: l.name, code: l.code, value: l.balance, id: l._id }))

    const income = ledgers.filter(l => l.type === 'Income').reduce((s, l) => s + (l.balance || 0), 0)
    const expense = ledgers.filter(l => l.type === 'Expense').reduce((s, l) => s + (l.balance || 0), 0)
    const retained = Number((income - expense).toFixed(2))

    if (Math.abs(retained) > 0.001) {
      equity.push({ name: 'Retained Earnings (YTD)', code: 'RE', value: retained, id: null })
    }

    const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0)
    const totalLiabEq =
      liabilities.reduce((s, a) => s + (a.value || 0), 0) + equity.reduce((s, a) => s + (a.value || 0), 0)

    res.json({
      data: {
        assets,
        liabilities,
        equity,
        totals: {
          assets: Number(totalAssets.toFixed(2)),
          liabilitiesAndEquity: Number(totalLiabEq.toFixed(2)),
          income: Number(income.toFixed(2)),
          expense: Number(expense.toFixed(2)),
          retainedEarnings: retained
        }
      }
    })
  } catch (error) {
    console.error('getBalanceSheet', error)
    res.status(500).json({ message: 'Failed to build balance sheet', error: error.message })
  }
}

exports.getDashboard = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    await ensureDefaultLedgers(companyId, req.user._id)

    const now = new Date()
    const year = Number(req.query.year) || now.getFullYear()
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31, 23, 59, 59)

    const [expenses, incomes, ledgers, recentJournals] = await Promise.all([
      Expense.find({ company: companyId, date: { $gte: start, $lte: end } }).populate('category', 'name'),
      Income.find({ company: companyId, date: { $gte: start, $lte: end } }),
      Ledger.find({ company: companyId, isActive: true }),
      JournalEntry.find({ company: companyId, status: 'posted', isVoided: false })
        .sort({ date: -1 })
        .limit(10)
        .populate('lines.ledger', 'name type')
    ])

    const totalExpenses = expenses.reduce((s, e) => {
      const vat = e.vat || 0
      return s + (e.amount || 0) * (1 + vat / 100)
    }, 0)
    const totalRevenue = incomes.reduce((s, i) => s + (i.amount || 0), 0)
    const profit = totalRevenue - totalExpenses

    const monthMap = {}
    for (let m = 0; m < 12; m++) {
      monthMap[m] = {
        month: new Date(year, m, 1).toLocaleString('en', { month: 'short' }),
        revenue: 0,
        expenses: 0
      }
    }
    for (const i of incomes) {
      const m = new Date(i.date).getMonth()
      if (monthMap[m]) monthMap[m].revenue += i.amount || 0
    }
    for (const e of expenses) {
      const m = new Date(e.date).getMonth()
      if (monthMap[m]) {
        const vat = e.vat || 0
        monthMap[m].expenses += (e.amount || 0) * (1 + vat / 100)
      }
    }

    const breakdownMap = {}
    for (const e of expenses) {
      const name = e.category?.name || 'Uncategorized'
      const vat = e.vat || 0
      const amt = (e.amount || 0) * (1 + vat / 100)
      breakdownMap[name] = (breakdownMap[name] || 0) + amt
    }
    const expenseBreakdown = Object.entries(breakdownMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))

    const recentTransactions = []
    for (const e of expenses
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)) {
      recentTransactions.push({
        id: e._id,
        date: e.date,
        category: e.category?.name || 'Expense',
        amount: e.amount,
        type: 'Expense'
      })
    }
    for (const i of incomes
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)) {
      recentTransactions.push({
        id: i._id,
        date: i.date,
        category: i.description || 'Income',
        amount: i.amount,
        type: 'Revenue'
      })
    }
    recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))

    const cashAssets = ledgers.filter(l => l.type === 'Asset').reduce((s, l) => s + (l.balance || 0), 0)

    res.json({
      data: {
        kpis: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalExpenses: Number(totalExpenses.toFixed(2)),
          profit: Number(profit.toFixed(2)),
          cashAssets: Number(cashAssets.toFixed(2)),
          journalCount: recentJournals.length
        },
        monthly: Object.values(monthMap).map(row => ({
          ...row,
          revenue: Number(row.revenue.toFixed(2)),
          expenses: Number(row.expenses.toFixed(2))
        })),
        expenseBreakdown,
        recentTransactions: recentTransactions.slice(0, 10),
        recentJournals
      }
    })
  } catch (error) {
    console.error('getDashboard', error)
    res.status(500).json({ message: 'Failed to load finance dashboard', error: error.message })
  }
}

exports.seedFromHistory = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user)
    await ensureDefaultLedgers(companyId, req.user._id)
    const { postExpenseJournal, postIncomeJournal } = require('../services/financeLedgerService')

    const expenses = await Expense.find({ company: companyId })
    const incomes = await Income.find({ company: companyId })

    let posted = 0
    for (const expense of expenses) {
      const exists = await JournalEntry.findOne({
        company: companyId,
        sourceType: 'expense',
        sourceId: expense._id,
        isVoided: false
      })
      if (exists) continue
      const vat = expense.vat || 0
      const amount = (expense.amount || 0) * (1 + vat / 100)
      await postExpenseJournal({
        companyId,
        userId: req.user._id,
        expense,
        amount,
        bankAccountId: expense.bankAccountId
      })
      posted++
    }

    for (const income of incomes) {
      const exists = await JournalEntry.findOne({
        company: companyId,
        sourceType: 'income',
        sourceId: income._id,
        isVoided: false
      })
      if (exists) continue
      await postIncomeJournal({
        companyId,
        userId: req.user._id,
        income,
        amount: income.amount || 0,
        bankAccountId: income.bankAccountId
      })
      posted++
    }

    res.json({ message: `Seeded ${posted} journal entries from history` })
  } catch (error) {
    console.error('seedFromHistory', error)
    res.status(500).json({ message: 'Failed to seed journals', error: error.message })
  }
}
