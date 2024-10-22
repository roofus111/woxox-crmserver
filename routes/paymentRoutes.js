const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateUser = require("../middleware/authenticateUser");
router.use(authenticateUser); 
// POST route to create a new payment
router.post('/', paymentController.createPayment);

// GET route to fetch all payments
router.get('/', paymentController.getAllPayments);

// GET route to fetch a single payment by ID
router.get('/:id', paymentController.getPaymentById);
router.get('/byLead/:leadId', paymentController.getPaymentsByLeads);

// PATCH route to update a payment by ID
router.patch('/:id', paymentController.updatePayment);

// DELETE route to delete a payment by ID
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
