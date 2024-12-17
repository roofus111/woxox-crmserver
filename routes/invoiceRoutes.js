const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create a new invoice
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);
router.post('/', invoiceController.createInvoice);

// Get all invoices
router.get('/get', invoiceController.getInvoices);

// Get a specific invoice by ID
router.get('/get/:id', invoiceController.getInvoiceById);
router.get('/bylead/:leadId', invoiceController.getInvoicesByLeads);

// Update an invoice
router.put('/:id', invoiceController.updateInvoice);

// Delete an invoice
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
