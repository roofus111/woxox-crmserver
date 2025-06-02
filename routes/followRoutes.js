/**
 * @swagger
 * components:
 *   schemas:
 *     LeadFollowUp:
 *       type: object
 *       required:
 *         - company
 *         - leadId
 *         - followUpDate
 *         - assignedTo
 *         - createdBy
 *       properties:
 *         company:
 *           type: string
 *           description: The company associated with the lead follow-up.
 *           example: 60d2b0b2f7dbb24b442c0a15
 *         leadId:
 *           type: string
 *           description: The ID of the lead that the follow-up is related to.
 *           example: 60d2b0b2f7dbb24b442c0a16
 *         followUpDate:
 *           type: string
 *           format: date
 *           description: The date the follow-up is scheduled.
 *           example: '2025-01-20'
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Closed]
 *           description: The current status of the follow-up.
 *           example: Pending
 *         notes:
 *           type: string
 *           description: Any additional notes or comments regarding the follow-up.
 *           example: "Follow-up for product inquiry"
 *         nextFollowUpDate:
 *           type: string
 *           format: date
 *           description: The date for the next follow-up, if applicable.
 *           example: '2025-01-25'
 *         assignedTo:
 *           type: string
 *           description: The ID of the user responsible for this follow-up.
 *           example: 60d2b0b2f7dbb24b442c0a17
 *         createdBy:
 *           type: string
 *           description: The ID of the user who created this follow-up.
 *           example: 60d2b0b2f7dbb24b442c0a18
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the follow-up record was created.
 *           example: '2025-01-15T10:00:00Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the follow-up record was last updated.
 *           example: '2025-01-17T10:00:00Z'
 */
const express = require('express');
const router = express.Router();
const leadFollowUpController = require('../controllers/followUpController');

// Create a new follow-up


const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); // Apply authentication to all routes
/**
 * @swagger
 * /api/followups/:
 *   post:
 *     summary: Create a new leadfollowup
 *     description: Adds a new customer to the database with the provided details.
 *     tags:
 *       - LeadFollowUp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeadFollowUp'
 *           description: The leadfollowup object that needs to be added to the system.
 *     responses:
 *       201:
 *         description: leadfollowup successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadFollowUp'
 *       400:
 *         description: Bad Request - Invalid leadfollowup data
 *       401:
 *         description: Unauthorized - Authentication failed or missing token
 *       409:
 *         description: Conflict - leadfollowup with the provided email or phone already exists
 *       500:
 *         description: Internal Server Error - Failed to create leadfollowup
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.post('/', leadFollowUpController.createFollowUp);
 /**
 * @swagger
 * /api/followups/{leadId}:
 *   get:
 *     summary: Get all follow-ups for a specific lead
 *     description: Fetch all lead follow-ups for a given lead, identified by the `leadId`.
 *     tags:
 *       - LeadFollowUp
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the lead to fetch follow-ups for.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of follow-ups for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadFollowUp'
 *       404:
 *         description: No follow-ups found for the specified lead.
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

router.get('/:leadId', leadFollowUpController.getFollowUpsByLead);


/**
 * @swagger
 * /api/followups/:
 *   get:
 *     summary: Get all lead follow-ups
 *     description: Fetch all lead follow-ups, optionally filtered by query parameters.
 *     tags:
 *       - LeadFollowUp
 *     parameters:
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: The ID of the company to filter lead follow-ups.
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: The ID of the lead to filter follow-ups.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Closed]
 *         description: The status to filter follow-ups by.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of lead follow-ups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadFollowUp'
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

router.get('/', leadFollowUpController.getAllfollowUps);
/**
 * @swagger
 * /api/followups/myfollow/get:
 *   get:
 *     summary: Get all follow-ups assigned to the current user
 *     description: Fetch all lead follow-ups assigned to the logged-in user, filtered by their company.
 *     tags:
 *       - LeadFollowUp
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of lead follow-ups assigned to the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadFollowUp'
 *       404:
 *         description: No follow-ups found for the current user
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

router.get('/myfollow/get', leadFollowUpController.getMyfollowUps);
// Get a specific follow-up by ID
/**
 * @swagger
 * /api/followups/byId/{followUpId}:
 *   get:
 *     summary: Get a specific follow-up by its ID
 *     description: Fetch a single lead follow-up by providing the `followUpId`.
 *     tags:
 *       - LeadFollowUp
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the follow-up to fetch.
 *     responses:
 *       200:
 *         description: Successfully retrieved the follow-up details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadFollowUp'
 *       404:
 *         description: Follow-up not found for the given ID.
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

router.get('/byId/:followUpId', leadFollowUpController.getFollowUpById);
/**
 * @swagger
 * /api/followups/update/{followUpId}:
 *   put:
 *     summary: Update a specific follow-up
 *     description: Update the details of a specific follow-up by its ID. Supports updating the follow-up date, status, notes, next follow-up date, and assigned user.
 *     tags:
 *       - LeadFollowUp 
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the follow-up to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followUpDate:
 *                 type: string
 *                 format: date
 *                 description: The date of the follow-up.
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed, Closed]
 *                 description: The current status of the follow-up.
 *               notes:
 *                 type: string
 *                 description: Additional notes for the follow-up.
 *               nextFollowUpDate:
 *                 type: string
 *                 format: date
 *                 description: The next follow-up date.
 *               assignedTo:
 *                 type: string
 *                 pattern: "^[a-fA-F0-9]{24}$"
 *                 description: The ID of the user to assign the follow-up to.
 *     responses:
 *       200:
 *         description: Follow-up updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 followUp:
 *                   $ref: '#/components/schemas/LeadFollowUp'
 *       404:
 *         description: Follow-up not found for the given ID.
 *       500:
 *         description: An error occurred while updating the follow-up.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Update a follow-up
router.put('/update/:followUpId', leadFollowUpController.updateFollowUp);

// Delete a follow-up
/**
 * @swagger
 * /api/followups/delete/{followUpId}:
 *   delete:
 *     summary: Delete a specific follow-up
 *     description: Deletes a follow-up by its ID and logs the deletion action.
 *     tags:
 *       - LeadFollowUp
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the follow-up to delete.
 *     responses:
 *       200:
 *         description: Follow-up deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Follow-up deleted successfully."
 *                 activity:
 *                   type: object
 *                   properties:
 *                     leadId:
 *                       type: string
 *                       description: The ID of the lead associated with the follow-up.
 *                     userId:
 *                       type: string
 *                       description: The ID of the user who performed the deletion.
 *                     company:
 *                       type: string
 *                       description: The ID of the company associated with the follow-up.
 *                     action:
 *                       type: string
 *                       description: The action performed (e.g., deleted).
 *                     details:
 *                       type: string
 *                       description: Details of the deletion action.
 *                     ipAddress:
 *                       type: string
 *                       description: The IP address from which the request was made.
 *                     userAgent:
 *                       type: string
 *                       description: The user agent string from the request headers.
 *       404:
 *         description: Follow-up not found for the given ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Follow-up not found."
 *       500:
 *         description: Server error occurred during the deletion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error."
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/delete/:followUpId', leadFollowUpController.deleteFollowUp);
router.delete('/delete-with-no-lead', leadFollowUpController.deleteLeadFollowUpsWithNoLeadId);
/**
 * @swagger
 * /api/followups/follow-up/{followUpId}:
 *   put:
 *     summary: Update a specific follow-up
 *     description: Updates a follow-up by its ID with fields such as follow-up date, status, notes, next follow-up date, and assigned user.
 *     tags:
 *       - LeadFollowUp
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the follow-up to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followUpDate:
 *                 type: string
 *                 format: date
 *                 description: The date of the follow-up (ISO format).
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed, Closed]
 *                 description: The current status of the follow-up.
 *               notes:
 *                 type: string
 *                 description: Additional notes for the follow-up.
 *               nextFollowUpDate:
 *                 type: string
 *                 format: date
 *                 description: The next follow-up date (ISO format).
 *               assignedTo:
 *                 type: string
 *                 pattern: "^[a-fA-F0-9]{24}$"
 *                 description: The ObjectId of the user assigned to the follow-up.
 *     responses:
 *       200:
 *         description: Follow-up updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Follow-up updated successfully."
 *                 followUp:
 *                   $ref: '#/components/schemas/LeadFollowUp'
 *       404:
 *         description: Follow-up not found for the given ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Follow-up not found."
 *       500:
 *         description: An error occurred while updating the follow-up.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while updating the follow-up."
 *                 error:
 *                   type: string
 *                   example: "Error message here"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Route to update all follow-up details (including nextFollowUpDate)
router.put('/follow-up/:followUpId', leadFollowUpController.updateFollowUp);

router.get('/stats/get/recentandupcoming', leadFollowUpController.getRecentAndUpcomingFollowUps);

//Version 2
router.get('/v2/gettasks',leadFollowUpController.getFilteredFollowUps);

router.post('/v2/createfollowup',leadFollowUpController.createWoxiFollowUp);

module.exports = router;
