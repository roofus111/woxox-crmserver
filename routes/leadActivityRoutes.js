/**
 * @swagger
 * components:
 *   schemas:
 *     LeadActivityLog:
 *       type: object
 *       required:
 *         - company
 *         - leadId
 *         - action
 *         - ipAddress
 *       properties:
 *         company:
 *           type: string
 *           format: ObjectId
 *           description: The ID of the company associated with the lead activity.
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: The ID of the user managing the lead.
 *         leadId:
 *           type: string
 *           format: ObjectId
 *           description: The ID of the lead associated with this activity.
 *         action:
 *           type: string
 *           enum: [created, updated, status_change, note_added, assigned, deleted, followUp, notPicked, Rescheduled]
 *           description: The type of action performed on the lead.
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the activity occurred. Defaults to the current date and time.
 *         details:
 *           type: string
 *           description: Additional details or notes about the action.
 *         ipAddress:
 *           type: string
 *           description: The IP address of the user who performed the action.
 *         userAgent:
 *           type: string
 *           description: The user agent of the device or browser performing the action.
 *       example:
 *         company: "60d0fe4f5311236168a109ca"
 *         userId: "60d0fe4f5311236168a109cb"
 *         leadId: "60d0fe4f5311236168a109cc"
 *         action: "status_change"
 *         timestamp: "2025-01-18T12:34:56Z"
 *         details: "Status changed from pending to contacted"
 *         ipAddress: "192.168.1.1"
 *         userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
 */

const express = require('express');
const router = express.Router();
const leadActivityController = require('../controllers/leadActivityController');

const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); // Apply authentication to all routes
/**
 * @swagger
 * /api/leadactivity/:
 *   post:
 *     summary: Create a new lead activity
 *     description: This endpoint allows you to create a new activity related to a lead, such as status changes or updates.
 *     tags:
 *       - LeadActivity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadId
 *               - action
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead related to the activity.
 *                 example: "60d2bc3d3c2d5f3b8b0d4eaa"
 *               action:
 *                 type: string
 *                 description: The action performed on the lead.
 *                 enum: [created, updated, status_change, note_added, assigned, deleted, followUp, notPicked, Rescheduled]
 *                 example: "created"
 *               details:
 *                 type: string
 *                 description: Additional details about the action (optional).
 *                 example: "Lead status changed from 'Interested' to 'Contacted'"
 *     responses:
 *       201:
 *         description: Successfully created the lead activity.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadActivityLog'
 *       400:
 *         description: Bad request, validation failed.
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

router.post('/', leadActivityController.createLeadActivity);
/**
 * @swagger
 * /api/leadactivity/{leadId}:
 *   get:
 *     summary: Get all activities for a specific lead
 *     description: Fetch all activities (e.g., status changes, updates) related to a specific lead.
 *     tags:
 *       - LeadActivity
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead for which activities are being fetched.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved lead activities.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadActivityLog'
 *       400:
 *         description: Bad request, invalid lead ID or missing parameter.
 *       500:
 *         description: Internal server error while fetching activities.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Route to get all activities for a lead
router.get('/:leadId', leadActivityController.getLeadActivities);

// Route to get filtered activities for a lead
/**
 * @swagger
 * /api/leadactivity/filter/{leadId}:
 *   get:
 *     summary: Get filtered activities for a specific lead
 *     description: Fetch lead activities for a particular lead, optionally filtered by userId and action.
 *     tags:
 *       - LeadActivity
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead for which activities are being fetched.
 *         schema:
 *           type: string
 *           example: "60d2bc3d3c2d5f3b8b0d4eaa"
 *       - in: query
 *         name: userId
 *         required: false
 *         description: The ID of the user who performed the activity. If provided, the results will be filtered by this user.
 *         schema:
 *           type: string
 *           example: "60d2bc3d3c2d5f3b8b0d4eab"
 *       - in: query
 *         name: action
 *         required: false
 *         description: The action performed on the lead. If provided, the results will be filtered by this action.
 *         schema:
 *           type: string
 *           enum: 
 *             - created
 *             - updated
 *             - status_change
 *             - note_added
 *             - assigned
 *             - deleted
 *             - followUp
 *             - notPicked
 *             - Rescheduled
 *           example: "status_change"
 *     responses:
 *       200:
 *         description: Successfully retrieved filtered lead activities.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadActivityLog'
 *       400:
 *         description: Bad request, invalid leadId or query parameters.
 *       500:
 *         description: Internal server error while fetching filtered activities.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/filter/:leadId', leadActivityController.getFilteredLeadActivities);

// Route to delete all activities for a lead (if needed)
/**
 * @swagger
 * /api/leadactivity/{leadId}:
 *   delete:
 *     summary: Delete all activities for a specific lead
 *     description: Deletes all activities associated with a particular lead.
 *     tags:
 *       - LeadActivity
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose activities will be deleted.
 *         schema:
 *           type: string
 *           example: "60d2bc3d3c2d5f3b8b0d4eaa"
 *     responses:
 *       200:
 *         description: Successfully deleted lead activities.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead activities deleted successfully"
 *       400:
 *         description: Bad request, invalid lead ID or missing lead ID.
 *       500:
 *         description: Internal server error while deleting lead activities.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/:leadId', leadActivityController.deleteLeadActivities);
/**
 * @swagger
 * /api/leadactivity/get/insight:
 *   get:
 *     summary: Get lead activities by company
 *     description: This endpoint returns the lead activities for a specific company, optionally filtered by date range and sorted.
 *     tags:
 *       - LeadActivity 
*     parameters:
 *       - in: query
 *         name: sort
 *         description: Sort order for activities. Defaults to descending order by timestamp.
 *         schema:
 *           type: string
 *           enum: 
 *             - created
 *             - updated
 *             - status_change
 *             - note_added
 *             - assigned
 *             - deleted
 *             - followUp
 *             - notPicked
 *             - Rescheduled
 *           example: "status_change"
 *       - in: query
 *         name: startDate
 *         description: The start date of the date range filter (YYYY-MM-DD).
 *         schema:
 *           type: string
 *           format: date
 *           example: '2025-01-01'
 *       - in: query
 *         name: endDate
 *         description: The end date of the date range filter (YYYY-MM-DD).
 *         schema:
 *           type: string
 *           format: date
 *           example: '2025-01-15'
 *     responses:
 *       200:
 *         description: Successfully fetched lead activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalActivities:
 *                   type: number
 *                   example: 10
 *                 groupedActivities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: '60c72b2f9f1b2c001fbb3c8a'
 *                           name:
 *                             type: string
 *                             example: 'John Doe'
 *                           email:
 *                             type: string
 *                             example: 'john.doe@example.com'
 *                       actions:
 *                         type: object
 *                         additionalProperties:
 *                           type: object
 *                           additionalProperties:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 timestamp:
 *                                   type: string
 *                                   format: date-time
 *                                   example: '2025-01-15T12:00:00Z'
 *                                 action:
 *                                   type: string
 *                                   example: 'assigned'
 *                                 details:
 *                                   type: string
 *                                   example: 'Lead assigned to John Doe'
 *       403:
 *         description: Unauthorized access, invalid company information in token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Unauthorized: Invalid company information in token'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Server error'
 *                 error:
 *                   type: string
 *                   example: 'Error message'
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.get('/get/insight',leadActivityController.getLeadActivitiesByCompany);
router.get('/get/activitylogs',leadActivityController.getActivityLogsByDate);
router.get('/get/activityKPI',leadActivityController.getActivityKPIs);
router.get('/get/leaderboard',leadActivityController.getLeaderboard);
module.exports = router;
