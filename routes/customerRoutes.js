/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       description: Schema for customer details in the system.
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           example: "John"
 *           description: The first name of the customer. Maximum 50 characters.
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           example: "Doe"
 *           description: The last name of the customer. Maximum 50 characters.
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *           description: The customer's email address. Must be unique and a valid email format.
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *           description: The customer's phone number. This is a required field.
 *         address:
 *           type: object
 *           description: The customer's address details.
 *           properties:
 *             street:
 *               type: string
 *               example: "123 Main St"
 *               description: The street of the customer's address.
 *             city:
 *               type: string
 *               example: "New York"
 *               description: The city of the customer's address.
 *             state:
 *               type: string
 *               example: "NY"
 *               description: The state of the customer's address.
 *             postalCode:
 *               type: string
 *               example: "10001"
 *               description: The postal/ZIP code of the customer's address.
 *             country:
 *               type: string
 *               example: "USA"
 *               description: The country of the customer's address.
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-01-01"
 *           description: The customer's date of birth in YYYY-MM-DD format.
 *         gender:
 *           type: string
 *           enum:
 *             - Male
 *             - Female
 *             - Other
 *           example: "Male"
 *           description: The gender of the customer. Allowed values are 'Male', 'Female', or 'Other'.
 *         joinDate:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T10:00:00Z"
 *           description: The date and time when the customer joined. Defaults to the current timestamp.
 *         status:
 *           type: string
 *           enum:
 *             - Active
 *             - Inactive
 *           default: "Active"
 *           example: "Active"
 *           description: The customer's status. Can be 'Active' or 'Inactive'. Default is 'Active'.
 *         notes:
 *           type: string
 *           example: "Preferred customer"
 *           description: Additional notes about the customer.
 *       required:
 *         - phone
 *       additionalProperties: false
 */

const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);
/**
 * @swagger
 * /api/customer/createcustomer:
 *   post:
 *     summary: Create a new customer
 *     description: Adds a new customer to the database with the provided details.
 *     tags:
 *       - Customers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *           description: The customer object that needs to be added to the system.
 *     responses:
 *       201:
 *         description: Customer successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad Request - Invalid customer data
 *       401:
 *         description: Unauthorized - Authentication failed or missing token
 *       409:
 *         description: Conflict - Customer with the provided email or phone already exists
 *       500:
 *         description: Internal Server Error - Failed to create customer
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.post('/createcustomer', CustomerController.createCustomer);
/**
 * @swagger
 * /api/customer/getcustomers:
 *   get:
 *     summary: Retrieve a list of customers
 *     description: Retrieve a list of all customers with their details. Supports filtering by status and pagination.
 *     tags:
 *       - Customers
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - Active
 *             - Inactive
 *         description: Filter customers by their status.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for paginated results.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records to return per page.
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad Request - Invalid query parameters
 *       500:
 *         description: Internal Server Error - Failed to retrieve customers
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getcustomers',CustomerController. getAllCustomers); // Fetch all customers
/**
 * @swagger
 * /api/customer/getcustomer/{customerId}:
 *   get:
 *     summary: Retrieve a customer by ID
 *     description: Get details of a specific customer by their unique ID.
 *     tags:
 *       - Customers
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the customer to retrieve.
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad Request - Invalid customer ID
 *       401:
 *         description: Unauthorized - Authentication failed or missing token
 *       404:
 *         description: Not Found - Customer with the specified ID does not exist
 *       500:
 *         description: Internal Server Error - Failed to retrieve customer
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getcustomer/:customerId',CustomerController. getCustomerDetails); 
/**
 * @swagger
 * /api/customer/updatecustomer/{customerId}:
 *   put:
 *     summary: Update a customer's details
 *     description: Updates the details of an existing customer based on their unique ID.
 *     tags:
 *       - Customers
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the customer to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *           description: The updated customer details.
 *     responses:
 *       200:
 *         description: Customer successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Bad Request - Invalid customer data
 *       401:
 *         description: Unauthorized - Authentication failed or missing token
 *       404:
 *         description: Not Found - Customer with the specified ID does not exist
 *       409:
 *         description: Conflict - Attempt to update with conflicting data (e.g., duplicate email/phone)
 *       500:
 *         description: Internal Server Error - Failed to update customer
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/updatecustomer/:customerId',CustomerController.updateCustomer);
/**
 * @swagger
 * /api/customer/deletecustomer/{customerId}:
 *   delete:
 *     summary: Delete a customer by ID
 *     description: Deletes a customer from the database using their unique ID.
 *     tags:
 *       - Customers
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the customer to delete.
 *     responses:
 *       200:
 *         description: Customer successfully deleted
 *       400:
 *         description: Bad Request - Invalid customer ID
 *       401:
 *         description: Unauthorized - Authentication failed or missing token
 *       404:
 *         description: Not Found - Customer with the specified ID does not exist
 *       500:
 *         description: Internal Server Error - Failed to delete customer
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/deletecustomer/:customerId', CustomerController.deleteCustomer);
module.exports = router;