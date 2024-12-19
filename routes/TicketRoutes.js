const express = require('express');
const router = express.Router();
const multer = require("multer");
const ticketController = require('../controllers/TicketController'); // Adjust the path as needed
const storage = multer.memoryStorage();
const upload = multer({ storage });
// POST route to create a new ticket
router.post('/create', upload.array('attachments'),ticketController.createTicket);

module.exports = router;
