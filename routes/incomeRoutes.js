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


module.exports = router;
