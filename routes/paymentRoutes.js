const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateUser = require("../middleware/authenticateUser");
router.use(authenticateUser); 

router.post('/', paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.get('/byLead/:leadId', paymentController.getPaymentsByLeads);
router.patch('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
