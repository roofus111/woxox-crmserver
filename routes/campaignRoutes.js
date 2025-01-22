/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - company
 *         - user
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the campaign.
 *           example: 60e71f3b6e25f92a1c8c1234
 *         company:
 *           type: string
 *           description: Reference to the company associated with the campaign.
 *           example: 60e71f3b6e25f92a1c8c5678
 *         user:
 *           type: string
 *           description: Reference to the user or sales representative responsible for the campaign.
 *           example: 60e71f3b6e25f92a1c8c9101
 *         pipeline:
 *           type: string
 *           description: Reference to the pipeline associated with the campaign.
 *           example: 60e71f3b6e25f92a1c8c1122
 *         name:
 *           type: string
 *           description: The name of the campaign.
 *           example: "Spring Promotion 2025"
 *         description:
 *           type: string
 *           description: A brief description of the campaign.
 *           example: "This campaign focuses on increasing awareness for our spring collection."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the campaign was created.
 *           example: "2025-01-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the campaign was last updated.
 *           example: "2025-01-10T12:00:00Z"
 */

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

/**
 * @swagger
 * /api/campaign/createcampaign:
 *   post:
 *     summary: Create a new campaign
 *     description: This endpoint creates a new campaign for the authenticated user and associates it with their company.
 *     tags:
 *       - Campaign
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
 *                 description: The name of the campaign.
 *                 example: "Spring Promotion 2025"
 *               description:
 *                 type: string
 *                 description: A brief description of the campaign.
 *                 example: "This campaign focuses on increasing awareness for our spring collection."
 *               Pipeline:
 *                 type: string
 *                 description: The ID of the associated pipeline (optional).
 *                 example: "60e71f3b6e25f92a1c8c1122"
 *     responses:
 *       201:
 *         description: Campaign successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: "Error creating campaign"
 *                 error:
 *                   type: string
 *                   description: Details about the error.
 *                   example: "Name is required"
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.post('/createcampaign', campaignController.createCampaign);
// Route to get all campaigns by pipeline ID
/**
 * @swagger
 * /api/campaign/campaigns/pipeline/{pipelineId}:
 *   get:
 *     summary: Get campaigns by pipeline ID
 *     description: Retrieves all campaigns associated with a specific pipeline.
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: pipelineId
 *         required: true
 *         description: The ID of the pipeline to fetch campaigns for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaigns fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: "Campaigns fetched successfully."
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Pipeline ID is required.
 *       404:
 *         description: No campaigns found for the specified pipeline.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/campaigns/pipeline/:pipelineId',campaignController.getCampaignsByPipelineId);

/**
 * @swagger
 * /api/campaign/getcampaign:
 *   get:
 *     summary: Get all campaigns for the authenticated user's company
 *     description: Retrieves a list of campaigns associated with the company of the authenticated user, including user details.
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           description: Maximum number of campaigns to retrieve.
 *           example: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           description: Number of campaigns to skip.
 *           example: 0
 *     responses:
 *       200:
 *         description: List of campaigns retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: No campaigns found.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getcampaign', campaignController.getCampaign);
/**
 * @swagger
 * /api/campaign/updatecampaign/{campaignid}:
 *   put:
 *     summary: Update a campaign
 *     description: Updates the details of an existing campaign by its ID.
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: The ID of the campaign to update.
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
 *                 description: The updated name of the campaign.
 *                 example: "Spring Promotion 2025 - Updated"
 *               description:
 *                 type: string
 *                 description: A brief description of the campaign.
 *                 example: "Updated campaign focusing on spring offers."
 *               Pipeline:
 *                 type: string
 *                 description: The ID of the associated pipeline (optional).
 *                 example: "60e71f3b6e25f92a1c8c1122"
 *     responses:
 *       200:
 *         description: Campaign updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid input or missing required fields.
 *       404:
 *         description: Campaign not found.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.put('/updatecampaign/:campaignid', campaignController.updateCampaign);
/**
 * @swagger
 * /api/campaign/deletecampaign/{campaignid}:
 *   delete:
 *     summary: Delete a campaign
 *     description: Deletes an existing campaign by its ID.
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: The ID of the campaign to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: "Campaign deleted successfully."
 *       400:
 *         description: Campaign ID is required.
 *       404:
 *         description: Campaign not found.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/deletecampaign/:campaignid', campaignController.deleteCampaign);
/**
 * @swagger
 * /api/campaign/assignpipeline/{campaignId}:
 *   put:
 *     summary: Update the pipeline in a campaign
 *     description: Updates the pipeline reference in an existing campaign.
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         description: The ID of the campaign to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Pipeline:
 *                 type: string
 *                 description: The ID of the new pipeline to associate with the campaign.
 *                 example: "60e71f3b6e25f92a1c8c1123"
 *     responses:
 *       200:
 *         description: Pipeline updated successfully in campaign.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pipeline updated successfully in campaign."
 *                 campaign:
 *                   $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Missing or invalid input.
 *       404:
 *         description: Campaign or pipeline not found.
 *       500:
 *         description: Internal server error.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/assignpipeline/:campaignId', campaignController.updatePipelineInCampaign);


module.exports = router;


