const express = require('express')
const router = express.Router()
const ledgerController = require('../controllers/ledgerController')
const authenticateUser = require('../middleware/authenticateUser')

router.use(authenticateUser)

router.get('/dashboard', ledgerController.getDashboard)
router.get('/balance-sheet', ledgerController.getBalanceSheet)
router.get('/list', ledgerController.listLedgers)
router.post('/create', ledgerController.createLedger)
router.get('/journals', ledgerController.listJournals)
router.post('/journals', ledgerController.createJournal)
router.post('/journals/:id/void', ledgerController.voidJournal)
router.post('/seed-history', ledgerController.seedFromHistory)
router.get('/:id', ledgerController.getLedgerById)
router.put('/:id', ledgerController.updateLedger)

module.exports = router
