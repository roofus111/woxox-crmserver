/**
 * @swagger
 * components:
 *   schemas:
 *     Billing:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: First name of the billing contact
 *         lastName:
 *           type: string
 *           description: Last name of the billing contact
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the billing contact
 *         phone:
 *           type: string
 *           description: Phone number of the billing contact
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         address:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               description: Country name
 *             zipPostalCode:
 *               type: string
 *               description: ZIP or postal code
 *             streetAddress:
 *               type: string
 *               description: Street address
 *             city:
 *               type: string
 *               description: City name
 *             stateProvince:
 *               type: string
 *               description: State or province
 *           required:
 *             - country
 *             - zipPostalCode
 *             - streetAddress
 *             - city
 *             - stateProvince
 *         Plan:
 *           type: string
 *           description: Reference to the Plan model
 *         Payment:
 *           type: object
 *           properties:
 *             subtotal:
 *               type: number
 *               description: Subtotal amount before tax
 *             tax:
 *               type: number
 *               description: Tax amount
 *             total:
 *               type: number
 *               description: Total amount including tax
 *             discount:
 *               type: number
 *               description: Discount amount (optional)
 *             finalTotal:
 *               type: number
 *               description: Final amount to be paid
 *             savings:
 *               type: number
 *               description: Total savings amount (optional)
 *             originalTotal:
 *               type: number
 *               description: Original total before discounts
 *             planCost:
 *               type: number
 *               description: Cost of the plan
 *             productsCost:
 *               type: number
 *               description: Cost of additional products
 *             additionalUsersCost:
 *               type: number
 *               description: Cost for additional users
 *           required:
 *             - subtotal
 *             - tax
 *             - total
 *             - finalTotal
 *             - originalTotal
 *             - planCost
 *             - productsCost
 *             - additionalUsersCost
 *         status:
 *           type: string
 *           enum: [Pending, Paid, Failed, Refunded]
 *           default: Pending
 *           description: Current status of the billing record
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *         - companyName
 *         - address
 *         - Plan
 *         - Payment
 */

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

/**
 * @swagger
 * /api/billing/create:
 *   post:
 *     summary: Create a new billing record
 *     description: Creates a new billing record with customer information, plan details, and payment information
 *     tags:
 *       - Billing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Billing'
 *     responses:
 *       201:
 *         description: Billing record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billing:
 *                   $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.post('/create', billingController.createBilling);

/**
 * @swagger
 * /api/billing/all:
 *   get:
 *     summary: Get all billing records
 *     description: Retrieves all billing records with optional filtering and pagination
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Failed, Refunded]
 *         description: Filter by billing status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Billing records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Billing'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalRecords:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/all', billingController.getAllBillings);

/**
 * @swagger
 * /api/billing/:id:
 *   get:
 *     summary: Get billing record by ID
 *     description: Retrieves a specific billing record by its ID
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Billing record ID
 *     responses:
 *       200:
 *         description: Billing record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billing:
 *                   $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Billing record not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', billingController.getBillingById);

/**
 * @swagger
 * /api/billing/email/:email:
 *   get:
 *     summary: Get billing records by email
 *     description: Retrieves all billing records for a specific email address
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to search for
 *     responses:
 *       200:
 *         description: Billing records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Email parameter is required
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/email/:email', billingController.getBillingsByEmail);

/**
 * @swagger
 * /api/billing/company/:companyName:
 *   get:
 *     summary: Get billing records by company name
 *     description: Retrieves all billing records for a specific company
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: companyName
 *         required: true
 *         schema:
 *           type: string
 *         description: Company name to search for
 *     responses:
 *       200:
 *         description: Billing records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Company name parameter is required
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/company/:companyName', billingController.getBillingsByCompany);

/**
 * @swagger
 * /api/billing/status/:status:
 *   get:
 *     summary: Get billing records by status
 *     description: Retrieves all billing records with a specific status
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, Paid, Failed, Refunded]
 *         description: Status to filter by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Billing records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Billing'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalRecords:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       400:
 *         description: Invalid status
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/status/:status', billingController.getBillingsByStatus);

/**
 * @swagger
 * /api/billing/stats:
 *   get:
 *     summary: Get billing statistics
 *     description: Retrieves billing statistics including counts by status and total revenue
 *     tags:
 *       - Billing
 *     responses:
 *       200:
 *         description: Billing statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalAmount:
 *                             type: number
 *                     totalBillings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', billingController.getBillingStats);

/**
 * @swagger
 * /api/billing/:id:
 *   put:
 *     summary: Update billing record
 *     description: Updates an existing billing record with new information
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Billing record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Billing'
 *     responses:
 *       200:
 *         description: Billing record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billing:
 *                   $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Billing record not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', billingController.updateBilling);

/**
 * @swagger
 * /api/billing/:id/status:
 *   patch:
 *     summary: Update billing status
 *     description: Updates the status of a billing record
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Billing record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid, Failed, Refunded]
 *                 description: New status for the billing record
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Billing status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billing:
 *                   $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Bad request - invalid status or ID format
 *       404:
 *         description: Billing record not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', billingController.updateBillingStatus);

/**
 * @swagger
 * /api/billing/:id:
 *   delete:
 *     summary: Delete billing record
 *     description: Deletes a billing record from the database
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Billing record ID
 *     responses:
 *       200:
 *         description: Billing record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billing:
 *                   $ref: '#/components/schemas/Billing'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Billing record not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', billingController.deleteBilling);

module.exports = router;
