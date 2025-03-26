const express = require('express');
const router = express.Router();
const IncomeController = require('../controllers/incomeController');
const authenticateUser = require('../middleware/authenticateUser');

/**
 * @swagger
 * components:
 *   schemas:
 *     Income:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         amount:
 *           type: number
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 */

/**
 * @swagger
 * /api/income/createincome:
 *   post:
 *     tags: [Income]
 *     summary: Create a new income
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Income'
 *     responses:
 *       201:
 *         description: Income created successfully
 *       401:
 *         description: Unauthorized
 */
router.use(authenticateUser)
router.post('/createincome', IncomeController.createIncome);

/**
 * @swagger
 * /api/income/getincome:
 *   get:
 *     tags: [Income]
 *     summary: Get all incomes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of incomes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Income'
 */
router.get('/getincome', IncomeController.getIncome);

/**
 * @swagger
 * /api/income/getincome/{id}:
 *   get:
 *     tags: [Income]
 *     summary: Get income by ID
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
 *         description: Income details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Income'
 *       404:
 *         description: Income not found
 */
router.get('/getincome/:id', IncomeController.getIncomeById);

/**
 * @swagger
 * /api/income/updateincome/{id}:
 *   put:
 *     tags: [Income]
 *     summary: Update income by ID
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
 *             $ref: '#/components/schemas/Income'
 *     responses:
 *       200:
 *         description: Income updated successfully
 *       404:
 *         description: Income not found
 */
router.put('/updateincome/:id', IncomeController.updateIncome);

/**
 * @swagger
 * /api/income/deleteincome/{id}:
 *   delete:
 *     tags: [Income]
 *     summary: Delete income by ID
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
 *         description: Income deleted successfully
 *       404:
 *         description: Income not found
 */
router.delete('/deleteincome/:id', IncomeController.deleteIncome);

/**
 * @swagger
 * /api/income/addincome/{incomeid}:
 *   post:
 *     tags: [Income]
 *     summary: Add category to income
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incomeid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category added successfully
 *       404:
 *         description: Income not found
 */
router.post('/addincome/:incomeid', IncomeController.addCategory);

/**
 * @swagger
 * /api/income/get/{incomeid}:
 *   get:
 *     tags: [Income]
 *     summary: Get all categories for an income
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incomeid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       404:
 *         description: Income not found
 */
router.get('/get/:incomeid', IncomeController.getCategories);

/**
 * @swagger
 * /api/income/income/{incomeid}/{categoryid}:
 *   get:
 *     tags: [Income]
 *     summary: Get category by ID for an income
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incomeid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Income or Category not found
 */
router.get('/income/:incomeid/:categoryid', IncomeController.getCategoryById);

/**
 * @swagger
 * /api/income/income/{incomeid}/{categoryid}:
 *   put:
 *     tags: [Income]
 *     summary: Update category for an income
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incomeid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Income or Category not found
 */
router.put('/income/:incomeid/:categoryid', IncomeController.updateCategory);

/**
 * @swagger
 * /api/income/income/{incomeid}/{categoryid}:
 *   delete:
 *     tags: [Income]
 *     summary: Delete a category from an income
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incomeid
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: categoryid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category or Income not found
 */
router.delete('/income/:incomeid/:categoryid', IncomeController.deleteCategory);

module.exports = router;
