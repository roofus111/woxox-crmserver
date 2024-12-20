const express = require('express');
const router = express.Router();
const multer = require("multer");
const ticketController = require('../controllers/TicketController'); // Adjust the path as needed
const storage = multer.memoryStorage();
const upload = multer({ storage });
// POST route to create a new ticket
router.post('/create', upload.array('attachments'),ticketController.createTicket);
// Get tickets (all tickets, filtered, or by ID)
router.get('/gettickets', ticketController.getTickets);
// Get a specific ticket by ID
router.get('/gettickets/:ticketId', ticketController.getTicketById);
// Get an attachment file URL
router.get('/tickets/:ticketId/attachments/:attachmentId', ticketController.getAttachmentById);

module.exports = router;
