const express = require('express');
const router = express.Router();
const IncomeController = require('../controllers/incomeController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)
router.post('/createincome', IncomeController.createIncome);
router.get('/getincome', IncomeController.getIncome);
router.get('/getincome/:id', IncomeController.getIncomeById);
router.put('/updateincome/:id', IncomeController.updateIncome);
router.delete('/deleteincome/:id', IncomeController.deleteIncome);
router.post('/addincome/:incomeid', IncomeController.addCategory);
router.get('/get/:incomeid', IncomeController.getCategories);
router.get('/income/:incomeid/:categoryid', IncomeController.getCategoryById);
router.put('/income/:incomeid/:categoryid', IncomeController.updateCategory);
router.delete('/income/:incomeid/:categoryid', IncomeController.deleteCategory);

module.exports = router;
