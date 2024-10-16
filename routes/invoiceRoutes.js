const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create a new invoice
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);
router.post('/', invoiceController.createInvoice);

// Get all invoices
router.get('/', invoiceController.getInvoices);

// Get a specific invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Update an invoice
router.put('/:id', invoiceController.updateInvoice);

// Delete an invoice
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
