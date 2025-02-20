const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const authenticateUser = require("../middleware/authenticateUser");
router.use(authenticateUser); 

// Create Payroll
router.post('/payroll', payrollController.createPayroll);

// Get All Payrolls
router.get('/payroll', payrollController.getAllPayrolls);

// Get Payroll by ID
router.get('/payroll/:id', payrollController.getPayrollById);

// Update Payroll
router.put('/payroll/:id', payrollController.updatePayroll);

// Delete Payroll
router.delete('/payroll/:id', payrollController.deletePayroll);

// Add Partial Payment
router.put('/payroll/:id/pay', payrollController.addPartialPayment);

router.get('/payroll/employee/:employeeId', payrollController.getPayrollByEmployeeId);

module.exports = router;
