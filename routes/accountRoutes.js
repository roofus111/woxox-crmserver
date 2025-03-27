const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController')
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/account/addbankaccount:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Bank Accounts
 *     summary: Add a new bank account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bank account created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/addbankaccount', accountsController.addBankAccount);

/**
 * @swagger
 * /api/account/getbankaccounts:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Bank Accounts
 *     summary: Get all bank accounts
 *     responses:
 *       200:
 *         description: List of bank accounts
 *       401:
 *         description: Unauthorized
 */
router.get('/getbankaccounts', accountsController.getBankAccounts);

/**
 * @swagger
 * /api/account/getbankaccounts/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Bank Accounts
 *     summary: Get bank account by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank account details
 *       404:
 *         description: Bank account not found
 *       401:
 *         description: Unauthorized
 */
router.get('/getbankaccounts/:id', accountsController.getBankAccountById);

/**
 * @swagger
 * /api/account/updatebankaccount/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Bank Accounts
 *     summary: Update bank account
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
 *             type: object
 *             properties:
 *               accountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank account updated successfully
 *       404:
 *         description: Bank account not found
 *       401:
 *         description: Unauthorized
 */
router.put('/updatebankaccount/:id', accountsController.updateBankAccount);

/**
 * @swagger
 * /api/account/toggle/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Bank Accounts
 *     summary: Toggle bank account status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bank account status toggled successfully
 *       404:
 *         description: Bank account not found
 *       401:
 *         description: Unauthorized
 */
router.put('/toggle/:id', accountsController.toggleBankAccountStatus);

/**
 * @swagger
 * /api/account/accounts/{accountId}:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Transactions
 *     summary: Add a new transaction
 *     parameters:
 *       - in: path
 *         name: accountId
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
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction added successfully
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.post('/accounts/:accountId', accountsController.addTransaction);

/**
 * @swagger
 * /api/account/transactions/{accountId}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Transactions
 *     summary: Get transactions by account ID
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions/:accountId', accountsController.getTransactionsByAccountId);

/**
 * @swagger
 * /api/account/history/{accountId}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Transactions
 *     summary: Get transaction history by account ID
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction history
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.get('/history/:accountId', accountsController.getTransactionHistory);

module.exports = router;