const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController')
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

router.post('/addbankaccount',accountsController.addBankAccount);
router.get('/getbankaccounts',accountsController.getBankAccounts);
router.get('/getbankaccounts/:id',accountsController.getBankAccountById);
router.put('/updatebankaccount/:id',accountsController.updateBankAccount);
router.put('/toggle/:id',accountsController.toggleBankAccountStatus);
router.post('/accounts/:accountId', accountsController.addTransaction);



module.exports = router;