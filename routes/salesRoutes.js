const express = require('express');
const router = express.Router();
const Sales = require('../controllers/salesController');

const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/create', Sales.createSale);
router.get('/getall', Sales.getAllSales);
router.get('/getsales/:id', Sales.getSaleById);        
router.put('/update/:id', Sales.updateSale);
router.delete('/delete/:id', Sales.deleteSale);
router.get('/customer/:customerId', Sales.getSalesByCustomerId);
router.get('/stats', Sales.getSalesStats);

module.exports = router;
