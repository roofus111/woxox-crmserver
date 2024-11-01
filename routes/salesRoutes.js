const express = require('express');
const router = express.Router();
const Sales = require('../controllers/salesController');

const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
router.get('/', Sales.getAllSalesByCompany);

module.exports = router;
