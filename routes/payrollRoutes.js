const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const authenticateUser = require("../middleware/authenticateUser");
router.use(authenticateUser); 

router.post('/getdetails', payrollController.getPayrollDetails);
router.post('/approve', payrollController.approvePayroll);
module.exports = router;
