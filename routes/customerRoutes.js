const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
router.post('/createcustomer', CustomerController.createCustomer);

router.get('/getcustomers',CustomerController. getAllCustomers); // Fetch all customers
router.get('/getcustomer/:customerId',CustomerController. getCustomerDetails); 
router.put('/updatecustomer/:customerId',CustomerController.updateCustomer);
router.delete('/deletecustomer/:customerId', CustomerController.deleteCustomer);
module.exports = router;