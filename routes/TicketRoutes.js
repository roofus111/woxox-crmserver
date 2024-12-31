const express = require('express');
const router = express.Router();
const multer = require("multer");
const ticketController = require('../controllers/TicketController'); // Adjust the path as needed
const storage = multer.memoryStorage();
const upload = multer({ storage });
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser)
// POST route to create a new ticket
router.post('/create', upload.array('attachments'),ticketController.createTicket);
// Get tickets (all tickets, filtered, or by ID)
router.get('/gettickets', ticketController.getTickets);
// Get a specific ticket by ID
router.get('/gettickets/:ticketId', ticketController.getTicketById);
// Get an attachment file URL
router.get('/tickets/:ticketId/attachments/:attachmentId', ticketController.getAttachmentById);
router.put('/notes/:noteId', ticketController.updateNote)

//notes
router.post('/createnotes', ticketController.createNote);
router.get('/getnotes/:ticketId', ticketController.getNotes);
router.put('/updatenotes/:noteId', ticketController.updateNote);
router.delete('/deletenotes/:noteId', ticketController.deleteNote);

//history
router.put('/updatehistory', ticketController.updateHistoryStatus);

module.exports = router;  
