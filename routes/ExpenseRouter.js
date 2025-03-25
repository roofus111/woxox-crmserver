/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated category ID
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the category
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Optional description of the category
 *     Expense:
 *       type: object
 *       required:
 *         - company
 *         - user
 *         - amount
 *       properties:
 *         company:
 *           type: string
 *           format: uuid
 *           description: Reference to the company ID
 *         user:
 *           type: string
 *           format: uuid
 *           description: Reference to the user ID
 *         amount:
 *           type: number
 *           minimum: 0
 *           description: The expense amount
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Optional description of the expense
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the expense
 *         paymentMethod:
 *           type: string
 *           enum: [Cash, Credit Card, Debit Card, Bank Transfer, Other]
 *           description: Method of payment
 *         receipt:
 *           type: string
 *           description: URL or reference to the receipt
 *         project:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Reference to associated project
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           description: List of expense categories
 *         recurring:
 *           type: boolean
 *           description: Whether the expense is recurring
 *         recurrenceInterval:
 *           type: string
 *           enum: [Daily, Weekly, Monthly, Yearly]
 *           nullable: true
 *           description: Interval for recurring expenses
 *         vat:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: VAT percentage
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, INR, JPY, AUD, Other]
 *           description: Currency of the expense
 *         isRefunded:
 *           type: boolean
 *           description: Whether the expense has been refunded
 *         refundAmount:
 *           type: number
 *           minimum: 0
 *           description: Amount refunded
 *         refundDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of the refund
 *         refundReason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for the refund
 *         originalExpense:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Reference to original expense if this is a refund
 *         totalAmount:
 *           type: number
 *           description: Calculated total amount including VAT and considering refunds
 *           readOnly: true
 */

const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/ExpenseController');
const authenticateUser = require('../middleware/authenticateUser');

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the expense
 *         amount:
 *           type: number
 *           description: The expense amount
 *         description:
 *           type: string
 *           description: Description of the expense
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the expense
 *         category:
 *           type: string
 *           description: Category of the expense
 */

/**
 * @swagger
 * /api/expense/createexpense:
 *   post:
  *     tags: [Expenses]
 *     summary: Create a new expense
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       201:
 *         description: Expense created successfully
 *       401:
 *         description: Unauthorized
 */
router.use(authenticateUser);
router.post('/createexpense', ExpenseController.createExpense);

/**
 * @swagger
 * /api/expense/getexpenses:
 *   get:
  *     tags: [Expenses]
 *     summary: Get all expenses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 */
router.get('/getexpenses', ExpenseController.getExpenses);

/**
 * @swagger
 * /api/expense/getexpense/{id}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expense by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense details
 *       404:
 *         description: Expense not found
 */
router.get('/getexpense/:id', ExpenseController.getExpenseById);

/**
 * @swagger
 * /api/expense/updateexpense/{id}:
 *   put:
  *     tags: [Expenses]
 *     summary: Update an expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *       404:
 *         description: Expense not found
 */
router.put('/updateexpense/:id', ExpenseController.updateExpense);

/**
 * @swagger
 * /api/expense/deleteexpense/{id}:
 *   delete:
  *     tags: [Expenses]
 *     summary: Delete an expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       404:
 *         description: Expense not found
 */
router.delete('/deleteexpense/:id', ExpenseController.deleteExpense);

/**
 * @swagger
 * /api/expense/{expenseId}/category:
 *   post:
 *     tags: [Expenses]
 *     summary: Add a category to an expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional description of the category
 *     responses:
 *       200:
 *         description: Category added successfully
 *       400:
 *         description: Invalid input or category already exists
 *       404:
 *         description: Expense not found
 */
router.post('/category/:expenseId', ExpenseController.addCategory);

/**
 * @swagger
 * /api/expense/{expenseId}/categories:
 *   get:
 *     tags: [Expenses]
 *     summary: Get all categories for an expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       404:
 *         description: Expense not found
 */
router.get('/categories/:expenseId', ExpenseController.getCategories);

/**
 * @swagger
 * /api/expense/{expenseId}/category/{categoryId}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get a specific category by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Expense or category not found
 */
router.get('/get/:expenseId/:categoryId', ExpenseController.getCategoryById);

/**
 * @swagger
 * /api/expense/{expenseId}/category/{categoryId}:
 *   put:
 *     tags: [Expenses]
 *     summary: Update a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: New name for the category
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: New description for the category
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input or category name already exists
 *       404:
 *         description: Expense or category not found
 */
router.put('/update/:expenseId/:categoryId', ExpenseController.updateCategory);

/**
 * @swagger
 * /api/expense/{expenseId}/category/{categoryId}:
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Expense or category not found
 */
router.delete('/delete/:expenseId/:categoryId', ExpenseController.deleteCategory);

module.exports = router; 

