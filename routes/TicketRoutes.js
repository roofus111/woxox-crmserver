/**
 * @swagger
 * components:
 *   schemas:
 *     Attachment:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the file
 *           example: "invoice.pdf"
 *         fileType:
 *           type: string
 *           description: Type of the file (e.g., PDF, PNG)
 *           example: "application/pdf"
 *         fileUrl:
 *           type: string
 *           description: URL where the file can be accessed
 *           example: "https://example.com/files/invoice.pdf"
 *       required:
 *         - fileName
 *         - fileUrl
 *     Note:
 *       type: object
 *       properties:
 *         note_id:
 *           type: string
 *           description: Unique identifier for the note
 *           example: "note12345"
 *         author:
 *           type: string
 *           description: ID of the user who authored the note
 *           example: "user12345"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the note was created
 *           example: "2025-01-19T12:00:00Z"
 *         content:
 *           type: string
 *           description: The content of the note
 *           example: "The issue is being looked into by the support team."
 *       required:
 *         - note_id
 *         - author
 *         - content
 *     History:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [Open, In Progress, Resolved, Closed]
 *           description: Current status of the ticket
 *           example: "In Progress"
 *         changed_by:
 *           type: string
 *           description: ID of the user who made the change
 *           example: "user67890"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the status was updated
 *           example: "2025-01-19T12:30:00Z"
 *       required:
 *         - status
 *         - changed_by
 *     Ticket:
 *       type: object
 *       properties:
 *         ticket_id:
 *           type: string
 *           description: Unique identifier for the ticket
 *           example: "TICKET-1611069319234"
 *         customer:
 *           type: string
 *           description: Customer associated with the ticket
 *           example: "customer12345"
 *         issue_details:
 *           type: object
 *           properties:
 *             subject:
 *               type: string
 *               description: Subject of the issue
 *               example: "Unable to login"
 *             description:
 *               type: string
 *               description: Detailed description of the issue
 *               example: "The user is unable to log in after resetting their password."
 *             category:
 *               type: string
 *               description: Category of the issue
 *               example: "Technical"
 *             sub_category:
 *               type: string
 *               description: Sub-category of the issue
 *               example: "Login Issues"
 *             priority:
 *               type: string
 *               enum: [Low, Medium, High, Critical]
 *               description: Priority level of the issue
 *               example: "High"
 *             status:
 *               type: string
 *               enum: [Open, In Progress, Resolved, Closed]
 *               description: Current status of the issue
 *               example: "Open"
 *             attachments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attachment'
 *               description: List of attachments related to the issue
 *               example: [
 *                 {
 *                   "fileName": "invoice.pdf",
 *                   "fileType": "application/pdf",
 *                   "fileUrl": "https://example.com/files/invoice.pdf"
 *                 }
 *               ]
 *           required:
 *             - subject
 *             - description
 *             - category
 *             - priority
 *             - status
 *         timestamps:
 *           type: object
 *           properties:
 *             created_at:
 *               type: string
 *               format: date-time
 *               description: Time when the ticket was created
 *               example: "2025-01-19T12:00:00Z"
 *             updated_at:
 *               type: string
 *               format: date-time
 *               description: Time when the ticket was last updated
 *               example: "2025-01-19T12:30:00Z"
 *             resolved_at:
 *               type: string
 *               format: date-time
 *               description: Time when the ticket was resolved
 *               example: null
 *         assignedTo:
 *           type: string
 *           description: ID of the user assigned to the ticket
 *           example: "user12345"
 *         company:
 *           type: string
 *           description: Company associated with the ticket
 *           example: "company123"
 *         notes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Note'
 *           description: List of notes related to the ticket
 *           example: [
 *             {
 *               "note_id": "note12345",
 *               "author": "user12345",
 *               "timestamp": "2025-01-19T12:00:00Z",
 *               "content": "The issue is being looked into by the support team."
 *             }
 *           ]
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/History'
 *           description: History of status changes for the ticket
 *           example: [
 *             {
 *               "status": "In Progress",
 *               "changed_by": "user67890",
 *               "timestamp": "2025-01-19T12:30:00Z"
 *             }
 *           ]
 *         sla:
 *           type: object
 *           properties:
 *             due_date:
 *               type: string
 *               format: date-time
 *               description: SLA due date for the ticket resolution
 *               example: "2025-01-21T12:00:00Z"
 *             time_to_respond:
 *               type: string
 *               description: SLA for response time
 *               example: "2 hours"
 *             time_to_resolve:
 *               type: string
 *               description: SLA for resolution time
 *               example: "24 hours"
 *       required:
 *         - ticket_id
 *         - customer
 *         - issue_details
 *         - company
 *         - status
 */


const express = require('express');
const router = express.Router();
const multer = require("multer");
const ticketController = require('../controllers/TicketController'); // Adjust the path as needed
const storage = multer.memoryStorage();
const upload = multer({ storage });
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)
// POST route to create a new ticket
/**
 * @swagger
 * /api/ticket/create:
 *   post:
 *     summary: Create a new ticket with optional file attachments.
 *     tags:
 *       - Tickets
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: ID of the customer creating the ticket.
 *                 example: "63bfc2b46f529f7b4c8eaf1a"
 *               assignedTo:
 *                 type: string
 *                 description: ID of the user the ticket is assigned to.
 *                 example: "63bfc2c46f529f7b4c8eaf1b"
 *               subject:
 *                 type: string
 *                 description: Subject of the ticket.
 *                 example: "Unable to access account"
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue.
 *                 example: "The user is unable to log in with their credentials."
 *               category:
 *                 type: string
 *                 description: Category of the issue.
 *                 example: "Technical Support"
 *               sub_category:
 *                 type: string
 *                 description: Sub-category of the issue.
 *                 example: "Login Issues"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *                 description: Priority level of the ticket.
 *                 example: "High"
 *               notes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     author:
 *                       type: string
 *                       description: Author ID for the note.
 *                     content:
 *                       type: string
 *                       description: Content of the note.
 *                 description: List of notes to be added to the ticket.
 *               sla:
 *                 type: object
 *                 properties:
 *                   due_date:
 *                     type: string
 *                     format: date-time
 *                     description: SLA due date.
 *                   time_to_respond:
 *                     type: string
 *                     description: SLA response time (e.g., "4 hours").
 *                   time_to_resolve:
 *                     type: string
 *                     description: SLA resolution time (e.g., "2 days").
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to be attached to the ticket.
 *     responses:
 *       201:
 *         description: Ticket created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket created successfully"
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Bad Request. Missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customer not found"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Error message details."
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.post('/create', upload.array('attachments'),ticketController.createTicket);
// Get tickets (all tickets, filtered, or by ID)

/**
 * @swagger
 * /api/ticket/gettickets:
 *   get:
 *     summary: Get a list of tickets or a specific ticket by ID
 *     description: This endpoint returns tickets based on query filters or a specific ticket if the ticketId is provided.
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: ticketId
 *         schema:
 *           type: string
 *         description: The unique identifier for the ticket to fetch a specific ticket by ID.
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: The customer ID to filter tickets by customer.
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: The user ID to filter tickets by the assigned user.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, In Progress, Resolved, Closed]
 *         description: The status to filter tickets by.
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *         description: The priority to filter tickets by.
 *     responses:
 *       200:
 *         description: A list of tickets or a single ticket object
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: No tickets found or the specific ticket with the provided ticketId was not found
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
router.get('/gettickets', ticketController.getTickets);
// Get a specific ticket by ID

/**
 * @swagger
 * /api/ticket/gettickets/{ticketId}:
 *   get:
 *     summary: Get a specific ticket by its ID
 *     description: This endpoint returns a ticket with all related data (customer, assigned user, and notes).
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the ticket to fetch.
 *     responses:
 *       200:
 *         description: A single ticket object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
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
router.get('/gettickets/:ticketId', ticketController.getTicketById);
// Get an attachment file URL
/**
 * @swagger
 * /api/ticket//tickets/{ticketId}/attachments/{attachmentId}:
 *   get:
 *     summary: Get an attachment by its ID
 *     description: Fetches and returns an attachment file associated with a specific ticket from the S3 bucket.
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the ticket containing the attachment.
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the attachment within the ticket.
 *     responses:
 *       200:
 *         description: Returns the requested attachment file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Ticket or attachment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.get('/tickets/:ticketId/attachments/:attachmentId', ticketController.getAttachmentById);
/**
 * @swagger
 * /api/ticket/notes/{noteId}:
 *   put:
 *     summary: Update a note in a specific ticket.
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the note to update.
 *       - in: body
 *         name: body
 *         required: true
 *         description: Details for updating the note.
 *         schema:
 *           type: object
 *           properties:
 *             ticketId:
 *               type: string
 *               description: ID of the ticket containing the note.
 *               example: "63bfc2b46f529f7b4c8eaf1a"
 *             content:
 *               type: string
 *               description: Updated content of the note.
 *               example: "Updated note content."
 *     responses:
 *       200:
 *         description: Note updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note updated successfully."
 *                 note:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "63bfc3d46f529f7b4c8eaf1b"
 *                     content:
 *                       type: string
 *                       example: "Updated note content."
 *                     author:
 *                       type: string
 *                       example: "63bfc2c46f529f7b4c8eaf1b"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-18T10:15:30Z"
 *       404:
 *         description: Note or ticket not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found."
 *       500:
 *         description: An error occurred while updating the note.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred."
 *                 error:
 *                   type: string
 *                   example: "Error details here."
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/notes/:noteId', ticketController.updateNote)
/**
 * @swagger
 * /api/ticket/tickets/{ticketId}/status:
 *   put:
 *     summary: Update the status of a ticket
 *     description: Updates the status of an existing ticket and records the change in the ticket's history.
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the ticket to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["Open", "In Progress", "Resolved", "Closed"]
 *                 description: The new status of the ticket.
 *                 example: "In Progress"
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Ticket status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Invalid input or ticket ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid status value"
 *                 error:
 *                   type: string
 *                   example: null
 *       404:
 *         description: Ticket not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Detailed error message"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/tickets/:ticketId/status',ticketController. updateTicketStatus);
/**
 * @swagger
 * /api/ticket/createnotes:
 *   post:
 *     summary: Add a note to a ticket
 *     description: This endpoint allows users to add a note to an existing ticket by providing the ticket ID.
 *     tags:
 *       - Tickets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketId:
 *                 type: string
 *                 example: "63bfc2c46f529f7b4c8eaf1b"                
 *               author:
 *                 type: string
 *                 example: "63bfc2b46f529f7b4c8eaf1a"                
 *               content:
 *                 type: string
 *                 description: The content of the note.
 *             required:
 *               - ticketId
 *               - author
 *               - content
 *     responses:
 *       201:
 *         description: Note added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note added successfully."
 *                 note:
 *                   type: object
 *                   properties:
 *                     note_id:
 *                       type: string
 *                       example: "1674509283478"
 *                     author:
 *                       type: string
 *                       example: "userId123"
 *                     content:
 *                       type: string
 *                       example: "This is a new note on the ticket."
 *       400:
 *         description: Bad request, missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket ID, author, and content are required."
 *       404:
 *         description: Ticket not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while adding the note."
 *                 error:
 *                   type: string
 *                   example: "Error details..."
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.post('/createnotes', ticketController.createNote);
/**
 * @swagger
 * /api/ticket/getnotes/{ticketId}:
 *   get:
 *     summary: Get all notes of a ticket
 *     description: This endpoint retrieves all notes associated with a specific ticket by the ticket's ID.
 *     tags:
 *       - Tickets
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         description: The unique ID of the ticket to retrieve notes for.
 *         schema:
 *           type: string
 *           example: "60e63b30e9f5b22b7a47b8d9"
 *     responses:
 *       200:
 *         description: Successfully retrieved the notes for the ticket.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       note_id:
 *                         type: string
 *                         example: "1674509283478"
 *                       author:
 *                         type: string
 *                         example: "userId123"
 *                       content:
 *                         type: string
 *                         example: "This is a note on the ticket."
 *       400:
 *         description: Invalid ticket ID format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ticket ID format."
 *       404:
 *         description: Ticket not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while retrieving notes."
 *                 error:
 *                   type: string
 *                   example: "Error details..."
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getnotes/:ticketId', ticketController.getNotes);
/**
 * @swagger
 * /api/ticket/updatenotes/{noteId}:
 *   put:
 *     summary: Update a specific note on a ticket
 *     description: This endpoint updates a note on a ticket identified by `ticketId` and `noteId`.
 *     tags:
 *       - Tickets
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         description: The unique ID of the note to update.
 *         schema:
 *           type: string
 *           example: "1674509283478"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
  *               ticketId:
 *                 type: string
 *                 example: "63bfc2c46f529f7b4c8eaf1b"                
 *               content:
 *                 type: string
 *                 description: The updated content for the note.
 *             required:
 *               - ticketId
 *               - content
 *     responses:
 *       200:
 *         description: Successfully updated the note.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note updated successfully."
 *                 note:
 *                   type: object
 *                   properties:
 *                     note_id:
 *                       type: string
 *                       example: "1674509283478"
 *                     content:
 *                       type: string
 *                       example: "Updated note content."
 *       400:
 *         description: Invalid ticket ID or note ID format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ticket ID format."
 *       404:
 *         description: Ticket or Note not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while updating the note."
 *                 error:
 *                   type: string
 *                   example: "Error details..."
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/updatenotes/:noteId', ticketController.updateNote);
/**
 * @swagger
 * /api/ticket/deletenotes/{noteId}:
 *   delete:
 *     summary: Delete a specific note from a ticket
 *     description: Deletes a note associated with a ticket based on the provided `ticketId` and `noteId`.
 *     tags:
 *       - Tickets
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         description: The unique ID of the note to delete.
 *         schema:
 *           type: string
 *           example: "64f8c0b8a1a2c36d34e3c71d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketId:
 *                 type: string
 *                 description: The ID of the ticket containing the note.
 *                 example: "60e63b30e9f5b22b7a47b8d9"
 *     responses:
 *       200:
 *         description: Successfully deleted the note.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note deleted successfully."
 *       400:
 *         description: Invalid ticket ID or note ID format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ticket ID format."
 *       404:
 *         description: Ticket or Note not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while deleting the note."
 *                 error:
 *                   type: string
 *                   example: "Error details..."
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/deletenotes/:noteId', ticketController.deleteNote);

//history
/**
 * @swagger
 * /api/ticket/updatehistory:
 *   put:
 *     summary: Update the status of a ticket and add an entry to the history
 *     description: Updates the ticket's status and appends a history record with the status change.
 *     tags:
 *       - Tickets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status for the ticket.
 *                 example: "Resolved"
 *                 enum:
 *                   - Open
 *                   - In Progress
 *                   - Resolved
 *                   - Closed
 *               ticketId:
 *                 type: string
 *                 description: The unique ID of the ticket to update.
 *                 example: "60e63b30e9f5b22b7a47b8d9"
 *     responses:
 *       200:
 *         description: Successfully updated the ticket status and history.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "History updated successfully."
 *                 ticket:
 *                   type: object
 *                   description: The updated ticket object.
 *       400:
 *         description: Bad request due to invalid data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid status provided."
 *       404:
 *         description: Ticket not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while updating the history."
 *                 error:
 *                   type: string
 *                   example: "Error details..."
   *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/updatehistory', ticketController.updateHistoryStatus);

module.exports = router;  
