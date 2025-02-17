const express = require('express');
const router = express.Router();
const Sales = require('../controllers/salesController');

const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
router.get('/', Sales.getAllSalesByCompany);
router.put('/accept', Sales.acceptSales);

module.exports = router;
