
const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/ExpenseController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createexpense', ExpenseController.createExpense);
router.get('/getexpenses', ExpenseController.getExpenses);
router.get('/getexpense/:id', ExpenseController.getExpenseById);
router.put('/updateexpense/:id', ExpenseController.updateExpense);
router.delete('/deleteexpense/:id', ExpenseController.deleteExpense);
module.exports = router;
