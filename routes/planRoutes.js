/**
 * @swagger
 * components:
 *   schemas:
 *     PurchasePlan:
 *       type: object
 *       properties:
 *         planName:
 *           type: string
 *           description: Name of the purchase plan
 *         price:
 *           type: number
 *           description: Price of the plan
 *         durationMonths:
 *           type: number
 *           description: Duration of the plan in months
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: List of features included in the plan
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the plan is active
 *         employeeLimit:
 *           type: number
 *           default: 1
 *           description: Maximum number of employees allowed
 *         moduleAccess:
 *           type: object
 *           properties:
 *             hr:
 *               type: boolean
 *               default: false
 *             customer:
 *               type: boolean
 *               default: false
 *             lead:
 *               type: boolean
 *               default: false
 *             pipeline:
 *               type: boolean
 *               default: false
 *             finance:
 *               type: boolean
 *               default: false
 *             documentation:
 *               type: boolean
 *               default: false
 *       required:
 *         - planName
 *         - price
 *         - durationMonths
 *         - employeeLimit
 *     
 *     ModulePurchase:
 *       type: object
 *       properties:
 *         moduleName:
 *           type: string
 *           description: Name of the module
 *         plans:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchasePlan'
 *       required:
 *         - moduleName
 *         - plans
 *     
 *     CompanyPurchase:
 *       type: object
 *       properties:
 *         companyId:
 *           type: string
 *           description: ID of the company
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ModulePurchase'
 *         purchaseDate:
 *           type: string
 *           format: date-time
 *           description: Date when the plan was purchased
 *         validTill:
 *           type: string
 *           format: date-time
 *           description: Date until which the plan is valid
 *         status:
 *           type: string
 *           enum: [active, inactive, expired, cancelled]
 *           default: active
 *           description: Current status of the purchase
 *         planType:
 *           type: string
 *           enum: [free, basic, premium, enterprise]
 *           default: free
 *           description: Type of the plan
 *         employeeLimit:
 *           type: number
 *           default: 1
 *           description: Maximum number of employees allowed
 *         autoRenew:
 *           type: boolean
 *           default: false
 *           description: Whether the plan auto-renews
 *         paymentMethod:
 *           type: string
 *           description: Method of payment used
 *         lastPaymentDate:
 *           type: string
 *           format: date-time
 *           description: Date of the last payment
 *         nextPaymentDate:
 *           type: string
 *           format: date-time
 *           description: Date of the next payment
 *       required:
 *         - companyId
 *         - modules
 */

const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

/**
 * @swagger
 * /api/plans/create:
 *   post:
 *     summary: Create a new company purchase plan
 *     description: Creates a new purchase plan for a company with specified modules and features
 *     tags:
 *       - Plans
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyPurchase'
 *     responses:
 *       201:
 *         description: Company purchase plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchase:
 *                   $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.post('/create', planController.createCompanyPurchase);

/**
 * @swagger
 * /api/plans/all:
 *   get:
 *     summary: Get all company purchase plans
 *     description: Retrieves all purchase plans from the database
 *     tags:
 *       - Plans
 *     responses:
 *       200:
 *         description: Company purchase plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanyPurchase'
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/all', planController.getAllCompanyPurchases);

/**
 * @swagger
 * /api/plans/:id:
 *   get:
 *     summary: Get company purchase plan by ID
 *     description: Retrieves a specific purchase plan by its ID
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase plan ID
 *     responses:
 *       200:
 *         description: Purchase plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchase:
 *                   $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Purchase plan not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', planController.getCompanyPurchaseById);

/**
 * @swagger
 * /api/plans/company/:companyId:
 *   get:
 *     summary: Get purchase plans by company ID
 *     description: Retrieves all purchase plans for a specific company
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company purchase plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Invalid company ID format
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/company/:companyId', planController.getCompanyPurchasesByCompanyId);

/**
 * @swagger
 * /api/plans/:id:
 *   put:
 *     summary: Update company purchase plan
 *     description: Updates an existing purchase plan with new information
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyPurchase'
 *     responses:
 *       200:
 *         description: Purchase plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchase:
 *                   $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Purchase plan not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', planController.updateCompanyPurchase);

/**
 * @swagger
 * /api/plans/:id:
 *   delete:
 *     summary: Delete company purchase plan
 *     description: Deletes a purchase plan from the database
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase plan ID
 *     responses:
 *       200:
 *         description: Purchase plan deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchase:
 *                   $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Purchase plan not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', planController.deleteCompanyPurchase);

/**
 * @swagger
 * /api/plans/active:
 *   get:
 *     summary: Get active purchase plans
 *     description: Retrieves all active purchase plans that haven't expired
 *     tags:
 *       - Plans
 *     responses:
 *       200:
 *         description: Active purchase plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanyPurchase'
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/active', planController.getActivePurchasePlans);

/**
 * @swagger
 * /api/plans/expired:
 *   get:
 *     summary: Get expired purchase plans
 *     description: Retrieves all expired purchase plans
 *     tags:
 *       - Plans
 *     responses:
 *       200:
 *         description: Expired purchase plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanyPurchase'
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/expired', planController.getExpiredPurchasePlans);

/**
 * @swagger
 * /api/plans/:id/status:
 *   patch:
 *     summary: Update purchase plan status
 *     description: Updates the status of a purchase plan
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, expired, cancelled]
 *                 description: New status for the purchase plan
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Purchase plan status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchase:
 *                   $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Bad request - invalid status or ID format
 *       404:
 *         description: Purchase plan not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', planController.updatePurchaseStatus);

/**
 * @swagger
 * /api/plans/type/:planType:
 *   get:
 *     summary: Get purchase plans by type
 *     description: Retrieves all purchase plans of a specific type
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: planType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [free, basic, premium, enterprise]
 *         description: Type of plan to filter by
 *     responses:
 *       200:
 *         description: Purchase plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 purchases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanyPurchase'
 *       400:
 *         description: Invalid plan type
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
router.get('/type/:planType', planController.getPurchasePlansByType);

module.exports = router;
