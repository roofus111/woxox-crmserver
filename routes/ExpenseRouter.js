
const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/ExpenseController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createexpense', ExpenseController.createExpense);
// router.put('/updatecategory/:expenseId/:categoryId', ExpenseController.updateCategoryInExpense);
// router.delete('/deletecategory/:expenseId/:categoryId', ExpenseController.deleteCategoryFromExpense);
// router.get('/getcategories/:expenseId', ExpenseController.getCategoriesByExpense);
// router.post('/addcategory/:expenseId', ExpenseController.addCategoryToExpense);

module.exports = router;

 