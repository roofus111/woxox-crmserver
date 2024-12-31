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
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - company
 *         - User
 *         - name
 *       properties:
 *         company:
 *           type: string
 *           description: The ID of the company associated with the campaign.
 *           example: "60b8f5c9fc8b6e001f5c8d9d"
 *         User:
 *           type: string
 *           description: The ID of the user (sales representative) associated with the campaign.
 *           example: "60b8f5c9fc8b6e001f5c8d9e"
 *         Pipeline:
 *           type: string
 *           description: The ID of the pipeline associated with the campaign.
 *           example: "60b8f5c9fc8b6e001f5c8d9f"
 *         name:
 *           type: string
 *           description: The name of the campaign.
 *           example: "Summer Sale Campaign"
 *         description:
 *           type: string
 *           description: A description of the campaign.
 *           example: "A special summer sale campaign targeting new customers."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the campaign was created.
 *           example: "2024-12-28T14:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the campaign was last updated.
 *           example: "2024-12-28T14:00:00Z"
 */

/**
 * @swagger
 * tags:
 *   - name: Campaign
 *     description: Operations related to campaigns
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
 *     summary: Insert new campaign data
 *     description: >
 *       This API is used to add a new campaign to MongoDB.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Campaigns
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: Campaign added successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Campaign added successfully."
 *       400:
 *         description: Bad Request - Invalid input.
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid request data."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to add the campaign. Please try again later."
 */

router.post('/createcampaign', campaignController.createCampaign);
// Route to get all campaigns by pipeline ID
/**
 * @swagger
* /api/campaign/campaigns/pipeline/{pipelineId}:
*   get:
*     summary: To get all campaigns from MongoDB
*     description: This API is used to fetch all campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: pipelineId
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
 *     security:
 *       - bearerAuth: []
*     responses:
*       200:
*         description: Successfully fetched campaigns from MongoDB.
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 $ref: '#/components/schemas/Campaign'
*/
router.get('/campaigns/pipeline/:pipelineId',campaignController.getCampaignsByPipelineId);
/**
 * @swagger
 * /api/campaign/getcampaign:
 *   get:
 *     summary: Retrieve all campaigns
 *     description: Fetch all campaigns stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 */

router.get('/getcampaign', campaignController.getCampaign);
/**
 * @swagger
 * /api/campaign/updatecampaign/{campaignid}:
 *   put:
 *     summary: Update campaign data in MongoDB
 *     description: This API is used to update campaign data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 */

router.put('/updatecampaign/:campaignid', campaignController.updateCampaign);
/**
 * @swagger
* /api/campaign/deletecampaign/{campaignid}:
*   delete:
*     summary: To delete record from mongodb
*     description: This API is used to delete campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: pipelineId
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
  *     security:
 *       - bearerAuth: []
*     responses:
*       200:
*         description: Data is deleted.
*/
router.delete('/deletecampaign/:campaignid', campaignController.deleteCampaign);
router.put('/assignpipeline/:campaignId', campaignController.updatePipelineInCampaign);


module.exports = router;


