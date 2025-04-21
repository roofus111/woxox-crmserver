// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     ExtraEarning:
//  *       type: object
//  *       required:
//  *         - category
//  *         - amount
//  *       properties:
//  *         category:
//  *           type: string
//  *           description: Type of extra earning (e.g., Bonus, Overtime)
//  *         amount:
//  *           type: number
//  *           description: Amount of extra earning
//  * 
//  *     Deduction:
//  *       type: object
//  *       required:
//  *         - category
//  *         - amount
//  *       properties:
//  *         category:
//  *           type: string
//  *           description: Type of deduction (e.g., Loan, LOP, Late Coming)
//  *         amount:
//  *           type: number
//  *           description: Amount of deduction
//  * 
//  *     PaymentHistory:
//  *       type: object
//  *       required:
//  *         - amountPaid
//  *         - paymentMethod
//  *       properties:
//  *         amountPaid:
//  *           type: number
//  *           description: Amount paid in this transaction
//  *         paymentDate:
//  *           type: string
//  *           format: date-time
//  *           description: Date of payment
//  *         paymentMethod:
//  *           type: string
//  *           enum: [Bank Transfer, Cash, Cheque, UPI]
//  *           description: Method of payment
//  * 
//  *     BankDetails:
//  *       type: object
//  *       required:
//  *         - accountHolderName
//  *         - accountNumber
//  *         - bankName
//  *         - branchName
//  *         - ifscCode
//  *       properties:
//  *         accountHolderName:
//  *           type: string
//  *           description: Name of account holder
//  *         accountNumber:
//  *           type: string
//  *           description: Bank account number
//  *         bankName:
//  *           type: string
//  *           description: Name of the bank
//  *         branchName:
//  *           type: string
//  *           description: Name of bank branch
//  *         ifscCode:
//  *           type: string
//  *           description: IFSC code of bank branch
//  *         swiftCode:
//  *           type: string
//  *           description: SWIFT code for international transactions
//  *         upiId:
//  *           type: string
//  *           description: UPI ID for digital payments
//  * 
//  *     Payroll:
//  *       type: object
//  *       required:
//  *         - employeeId
//  *         - employeeName
//  *         - department
//  *         - monthlySalary
//  *         - totalWorkingDays
//  *         - daysWorked
//  *         - paymentDate
//  *         - paymentMethod
//  *       properties:
//  *         employeeId:
//  *           type: string
//  *           description: Reference to Employee model
//  *         employeeName:
//  *           type: string
//  *           description: Name of the employee
//  *         department:
//  *           type: string
//  *           description: Department of the employee
//  *         monthlySalary:
//  *           type: number
//  *           description: Base monthly salary
//  *         totalWorkingDays:
//  *           type: number
//  *           description: Total working days in the month
//  *         daysWorked:
//  *           type: number
//  *           description: Actual days worked by employee
//  *         baseSalary:
//  *           type: number
//  *           description: Calculated base salary for days worked
//  *         extraEarnings:
//  *           type: array
//  *           items:
//  *             $ref: '#/components/schemas/ExtraEarning'
//  *           description: Array of extra earnings
//  *         deductions:
//  *           type: array
//  *           items:
//  *             $ref: '#/components/schemas/Deduction'
//  *           description: Array of deductions
//  *         totalExtraEarnings:
//  *           type: number
//  *           description: Sum of all extra earnings
//  *         totalDeductions:
//  *           type: number
//  *           description: Sum of all deductions
//  *         tax:
//  *           type: number
//  *           description: Tax amount
//  *         netSalary:
//  *           type: number
//  *           description: Final salary after all calculations
//  *         paidAmount:
//  *           type: number
//  *           description: Total amount paid so far
//  *         remainingSalary:
//  *           type: number
//  *           description: Remaining amount to be paid
//  *         paymentDate:
//  *           type: string
//  *           format: date
//  *           description: Date of payment
//  *         paymentMethod:
//  *           type: string
//  *           enum: [Bank Transfer, Cash, Cheque, UPI]
//  *           description: Method of payment
//  *         paymentStatus:
//  *           type: string
//  *           enum: [Pending, Half Paid, Paid, Failed]
//  *           description: Current payment status
//  *         bankDetails:
//  *           $ref: '#/components/schemas/BankDetails'
//  *           description: Bank account details
//  *         paymentHistory:
//  *           type: array
//  *           items:
//  *             $ref: '#/components/schemas/PaymentHistory'
//  *           description: History of partial payments
//  *         createdAt:
//  *           type: string
//  *           format: date-time
//  *           description: Record creation timestamp
//  *         updatedAt:
//  *           type: string
//  *           format: date-time
//  *           description: Record last update timestamp
//  * 
//  *     PayrollResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           description: Operation success status
//  *         message:
//  *           type: string
//  *           description: Response message
//  *         data:
//  *           $ref: '#/components/schemas/Payroll'
//  *           description: Payroll data
//  * 
//  *     PayrollListResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           description: Operation success status
//  *         count:
//  *           type: number
//  *           description: Total number of records
//  *         data:
//  *           type: array
//  *           items:
//  *             $ref: '#/components/schemas/Payroll'
//  *           description: Array of payroll records
//  */


// const express = require('express');
// const router = express.Router();
// const payrollController = require('../controllers/payrollController');
// const authenticateUser = require("../middleware/authenticateUser");
// router.use(authenticateUser); 

// /**
//  * @swagger
//  * /api/payroll/payroll:
//  *   post:
//  *     tags:
//  *       - Payroll
//  *     summary: Create new payroll
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - employeeId
//  *               - employeeName
//  *               - department
//  *               - monthlySalary
//  *               - totalWorkingDays
//  *               - daysWorked
//  *               - paymentDate
//  *               - paymentMethod
//  *             properties:
//  *               employeeId:
//  *                 type: string
//  *               employeeName:
//  *                 type: string
//  *               department:
//  *                 type: string
//  *               monthlySalary:
//  *                 type: number
//  *               totalWorkingDays:
//  *                 type: number
//  *               daysWorked:
//  *                 type: number
//  *     responses:
//  *       201:
//  *         description: Payroll created successfully
//  *       400:
//  *         description: Invalid input
//  */
// router.post('/payroll', payrollController.createPayroll);

// /**
//  * @swagger
//  * /api/payroll/payroll:
//  *   get:
//  *     tags:
//  *       - Payroll
//  *     summary: Get all payrolls
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: List of payrolls retrieved successfully
//  *       401:
//  *         description: Unauthorized
//  */
// router.get('/payroll', payrollController.getAllPayrolls);

// /**
//  * @swagger
//  * /api/payroll/payroll/{id}:
//  *   get:
//  *     tags:
//  *       - Payroll
//  *     summary: Get payroll by ID
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Payroll details retrieved successfully
//  *       404:
//  *         description: Payroll not found
//  */
// router.get('/payroll/:id', payrollController.getPayrollById);

// /**
//  * @swagger
//  * /api/payroll/payroll/{id}:
//  *   put:
//  *     tags:
//  *       - Payroll
//  *     summary: Update payroll
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               monthlySalary:
//  *                 type: number
//  *               totalWorkingDays:
//  *                 type: number
//  *               daysWorked:
//  *                 type: number
//  *     responses:
//  *       200:
//  *         description: Payroll updated successfully
//  *       404:
//  *         description: Payroll not found
//  */
// router.put('/payroll/:id', payrollController.updatePayroll);

// /**
//  * @swagger
//  * /api/payroll/{id}:
//  *   delete:
//  *     tags:
//  *       - Payroll
//  *     summary: Delete payroll
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Payroll deleted successfully
//  *       404:
//  *         description: Payroll not found
//  */
// router.delete('/payroll/:id', payrollController.deletePayroll);


// /**
//  * @swagger
//  * /api/payroll/payroll/employee/{employeeId}:
//  *   get:
//  *     tags:
//  *       - Payroll
//  *     summary: Get payroll by employee ID
//  *     parameters:
//  *       - in: path
//  *         name: employeeId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Employee payroll details retrieved successfully
//  *       404:
//  *         description: Employee payroll not found
//  */
// router.get('/payroll/employee/:employeeId', payrollController.getPayrollByEmployeeId);

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Payroll:
//  *       type: object
//  *       properties:
//  *         employeeId:
//  *           type: string
//  *         employeeName:
//  *           type: string
//  *         department:
//  *           type: string
//  *         monthlySalary:
//  *           type: number
//  *         totalWorkingDays:
//  *           type: number
//  *         daysWorked:
//  *           type: number
//  *         baseSalary:
//  *           type: number
//  *         netSalary:
//  *           type: number
//  *         paidAmount:
//  *           type: number
//  *         remainingSalary:
//  *           type: number
//  *         paymentStatus:
//  *           type: string
//  *           enum: [Pending, Half Paid, Paid]
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

// module.exports = router;
