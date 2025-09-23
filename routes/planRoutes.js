/**
 * @swagger
 * components:
 *   schemas:
 *     Addon:
 *       type: object
 *       properties:
 *         addonId:
 *           type: string
 *           description: Unique identifier for the addon
 *         addonName:
 *           type: string
 *           description: Name of the addon
 *         price:
 *           type: number
 *           description: Price of the addon
 *         quantity:
 *           type: number
 *           description: Quantity of the addon
 *         unit:
 *           type: string
 *           default: user
 *           description: Unit of measurement for the addon
 *         free:
 *           type: boolean
 *           default: false
 *           description: Whether the addon is free
 *         OnTimeInstall:
 *           type: boolean
 *           description: Whether it's a one-time installation
 *         OnTimeInstallPrice:
 *           type: number
 *           description: Price for one-time installation
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the addon is currently active
 *         activatedDate:
 *           type: string
 *           format: date-time
 *           description: Date when the addon was activated
 *         deactivatedDate:
 *           type: string
 *           format: date-time
 *           description: Date when the addon was deactivated
 *         expireOn:
 *           type: string
 *           format: date-time
 *           description: Date when the addon expires
 *         total:
 *           type: number
 *           description: Total cost of the addon
 *       required:
 *         - addonId
 *         - addonName
 *         - price
 *         - quantity
 *         - total
 *     
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
const { CompanyPurchase } = require('../models/Plan');
const mongoose = require('mongoose');

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

router.post('/push-addons/:planId', async (req, res) => {
  try {
    const companyId = req.user.company._id;
    const { planId } = req.params;
    const { addons } = req.body; // Expecting array of addon IDs
    const planIndex = 0;

    const updatedPlan = await CompanyPurchase.findOneAndUpdate(
      { _id: planId, companyId: companyId },
      {
        $addToSet: {
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess`]: {
            $each: addons
          }
        }
      },
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: 'No matching document found' });
    }

    res.status(200).json({
      message: 'Addons updated successfully (duplicates ignored)',
      data: updatedPlan.modules?.[0]?.plans?.[0]?.moduleAccess
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

/**
 * @swagger
 * /api/plans/uninstall-addons/{planId}:
 *   delete:
 *     summary: Uninstall addon from a plan (deactivate)
 *     description: Deactivates a specific addon from a company's purchase plan by setting it to inactive, setting deactivated date, and expire date to 30 days from activation date
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: planId
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
 *               addonId:
 *                 type: string
 *                 description: Single addon ID to uninstall/deactivate
 *                 example: "addon123"
 *             required:
 *               - addonId
 *     responses:
 *       200:
 *         description: Addon uninstalled successfully (deactivated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Addon uninstalled successfully (deactivated)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     uninstalledAddon:
 *                       $ref: '#/components/schemas/Addon'
 *                       description: The deactivated addon details
 *                     deactivatedDate:
 *                       type: string
 *                       format: date-time
 *                       description: Date when the addon was deactivated
 *                     expireOn:
 *                       type: string
 *                       format: date-time
 *                       description: Expiration date (30 days from activation date)
 *                     autoRenew:
 *                       type: boolean
 *                       description: Auto-renewal status (set to false)
 *       400:
 *         description: Bad request - invalid input or plan ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Single addon ID is required"
 *       404:
 *         description: Plan or addon not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     - "No matching plan found for this company"
 *                     - "Addon not found in this plan"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while uninstalling addon"
 *                 details:
 *                   type: string
 *     security:
 *       - bearerAuth: []
 */
router.put('/uninstall-addons/:planId', planController.uninstallAddons);

/**
 * @swagger
 * /api/plans/install-addons/{planId}:
 *   put:
 *     summary: Install addon to a plan (reactivate)
 *     description: Reactivates a specific addon in a company's purchase plan by setting it to active, updating activation date, and removing deactivation/expiration info
 *     tags:
 *       - Plans
 *     parameters:
 *       - in: path
 *         name: planId
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
 *               addonId:
 *                 type: string
 *                 description: Single addon ID to install/reactivate
 *                 example: "addon123"
 *             required:
 *               - addonId
 *     responses:
 *       200:
 *         description: Addon installed successfully (reactivated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Addon installed successfully (reactivated)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     installedAddon:
 *                       $ref: '#/components/schemas/Addon'
 *                       description: The reactivated addon details
 *                     activatedDate:
 *                       type: string
 *                       format: date-time
 *                       description: New activation date
 *                     isActive:
 *                       type: boolean
 *                       description: Active status (set to true)
 *       400:
 *         description: Bad request - invalid input or plan ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Single addon ID is required"
 *       404:
 *         description: Plan or addon not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     - "No matching plan found for this company"
 *                     - "Addon not found in this plan"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while installing addon"
 *                 details:
 *                   type: string
 *     security:
 *       - bearerAuth: []
 */
router.put('/install-addons/:planId', planController.installAddons);

module.exports = router;
