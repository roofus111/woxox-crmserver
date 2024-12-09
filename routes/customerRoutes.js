const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
router.post('/createcustomer', CustomerController.createCustomer);

router.get('/getcustomers',CustomerController. getAllCustomers); // Fetch all customers
router.get('/getcustomer/:id',CustomerController. getCustomerById); 
router.put('/updatecustomer/:id',CustomerController.updateCustomer);
router.delete('/deletecustomer/:id', CustomerController.deleteCustomer);
module.exports = router;