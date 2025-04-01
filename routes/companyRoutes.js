/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the company
 *         website:
 *           type: string
 *           description: The website of the company
 *         address:
 *           type: string
 *           description: The address of the company
 *         phone:
 *           type: string
 *           description: The phone number of the company
 *         email:
 *           type: string
 *           description: The email of the company (must be unique)
 *         industry:
 *           type: string
 *           description: The industry the company belongs to
 *         employees:
 *           type: integer
 *           description: The number of employees in the company
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the company was created
 *         Module:
 *           type: object
 *           properties:
 *             Customer:
 *               type: boolean
 *               default: false
 *               description: Indicates if the customer module is enabled
 *             lead:
 *               type: boolean
 *               default: false
 *               description: Indicates if the lead module is enabled
 *             pipeline:
 *               type: boolean
 *               default: false
 *               description: Indicates if the pipeline module is enabled
 *             finance:
 *               type: boolean
 *               default: false
 *               description: Indicates if the finance module is enabled
 *             documentation:
 *               type: boolean
 *               default: false
 *               description: Indicates if the documentation module is enabled
 */
const express = require('express');
const router = express.Router();
const Company=require("../models/Company")
const companyController = require('../controllers/companyController');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeCompanyAccess = require('../middleware/authorizeCompanyAccess');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

router.use(authenticateUser); // Apply authentication to all routes
/**
 * @swagger
 * /api/companies/:
 *   get:
 *     summary: Get a specific company by ID
 *     description: Retrieves the company associated with the authenticated user.
 *     tags:
 *       - Company
 *     responses:
 *       200:
 *         description: Company retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *             example:
 *               _id: "60d21b4667d0d8992e610c85"
 *               name: "Tech Innovations Inc."
 *               website: "https://www.techinnovations.com"
 *               address: "123 Tech Street, Silicon Valley, CA"
 *               phone: "+1 (123) 456-7890"
 *               email: "contact@techinnovations.com"
 *               industry: "Technology"
 *               employees: 250
 *               createdAt: "2025-01-22T08:00:00Z"
 *       404:
 *         description: Company not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/', companyController.getCompanyById);
/**
 * @swagger
 * /api/companies/getall:
 *   get:
 *     summary: Get all companies
 *     description: Retrieves all companies from the database.
 *     tags:
 *       - Company
 *     responses:
 *       200:
 *         description: List of companies retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *             example:
 *               - _id: "60d21b4667d0d8992e610c85"
 *                 name: "Tech Innovations Inc."
 *                 website: "https://www.techinnovations.com"
 *                 address: "123 Tech Street, Silicon Valley, CA"
 *                 phone: "+1 (123) 456-7890"
 *                 email: "contact@techinnovations.com"
 *                 industry: "Technology"
 *                 employees: 250
 *                 createdAt: "2025-01-22T08:00:00Z"
 *               - _id: "60d21b4667d0d8992e610c86"
 *                 name: "Design Studios Ltd."
 *                 website: "https://www.designstudios.com"
 *                 address: "456 Creative Ave, New York, NY"
 *                 phone: "+1 (987) 654-3210"
 *                 email: "info@designstudios.com"
 *                 industry: "Design"
 *                 employees: 150
 *                 createdAt: "2025-01-22T08:00:00Z"
 *       404:
 *         description: No companies found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No companies found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getall', companyController.getAllCompanies);
/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company with profile image
 *     description: Creates a new company with profile image and associates it with the authenticated user
 *     tags:
 *       - Company
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *               website:
 *                 type: string
 *                 description: Company website
 *               phone:
 *                 type: string
 *                 description: Company phone number
 *               email:
 *                 type: string
 *                 description: Company email (must be unique)
 *               industry:
 *                 type: string
 *                 description: Company industry
 *               employees:
 *                 type: integer
 *                 description: Number of employees
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - state
 *                   - country
 *                   - postalCode
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Company profile image (jpg, jpeg, png, gif)
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newCompany:
 *                   $ref: '#/components/schemas/Company'
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     role:
 *                       type: string
 *                     company:
 *                       type: string
 *       400:
 *         description: Invalid input or company already exists
 *       500:
 *         description: Internal server error
 */

router.post('/', upload.single('profileImage'), companyController.createCompany);
/**
 * @swagger
 * /api/companies/:
 *   put:
 *     summary: Update a company
 *     description: Updates the company associated with the authenticated user.
 *     tags:
 *       - Company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the company
 *                 example: "Tech Innovations Ltd."
 *               website:
 *                 type: string
 *                 description: The website URL of the company
 *                 example: "https://www.techinnovationsltd.com"
 *               address:
 *                 type: string
 *                 description: The new address of the company
 *                 example: "456 Tech Avenue, Silicon Valley, CA"
 *               phone:
 *                 type: string
 *                 description: The new phone number of the company
 *                 example: "+1 (123) 987-6543"
 *               email:
 *                 type: string
 *                 description: The new email of the company
 *                 example: "support@techinnovationsltd.com"
 *               industry:
 *                 type: string
 *                 description: The updated industry type of the company
 *                 example: "Technology"
 *               employees:
 *                 type: integer
 *                 description: The updated number of employees in the company
 *                 example: 300
 *     responses:
 *       200:
 *         description: Company updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *             example:
 *               _id: "60d21b4667d0d8992e610c85"
 *               name: "Tech Innovations Ltd."
 *               website: "https://www.techinnovationsltd.com"
 *               address: "456 Tech Avenue, Silicon Valley, CA"
 *               phone: "+1 (123) 987-6543"
 *               email: "support@techinnovationsltd.com"
 *               industry: "Technology"
 *               employees: 300
 *               createdAt: "2025-01-22T08:00:00Z"
 *       400:
 *         description: Invalid request or bad data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid data provided"
 *       404:
 *         description: Company not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/', authorizeCompanyAccess, companyController.updateCompany);
/**
 * @swagger
 * /api/companies/modules/{id}:
 *   put:
 *     summary: Update the modules for a company
 *     description: Updates the module settings (e.g., Customer, Lead, Pipeline, etc.) for a given company by its ID.
 *     tags:
 *       - Company
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the company whose modules are being updated.
 *         schema:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Module:
 *                 type: object
 *                 properties:
 *                   Customer:
 *                     type: boolean
 *                     description: Enable or disable the Customer module
 *                     example: true
 *                   lead:
 *                     type: boolean
 *                     description: Enable or disable the Lead module
 *                     example: false
 *                   pipeline:
 *                     type: boolean
 *                     description: Enable or disable the Pipeline module
 *                     example: true
 *                   finance:
 *                     type: boolean
 *                     description: Enable or disable the Finance module
 *                     example: false
 *                   documentation:
 *                     type: boolean
 *                     description: Enable or disable the Documentation module
 *                     example: true
 *     responses:
 *       200:
 *         description: Module updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Invalid data provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid data provided"
 *       404:
 *         description: Company not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.put('/modules/:id',companyController.updateModule);

// PATCH endpoint to update selected module values


router.put('/company/:id', async (req, res) => {
  const { id } = req.params;  // Company ID from URL
  const { Customer, lead, pipeline, finance, documentation } = req.body;  // Extract module values from request body

  // Create an object to store the updates
  const updateData = {};

  // Add the fields to the update object if they are provided
  if (Customer !== undefined) updateData['Module.Customer'] = Customer;
  if (lead !== undefined) updateData['Module.lead'] = lead;
  if (pipeline !== undefined) updateData['Module.pipeline'] = pipeline;
  if (finance !== undefined) updateData['Module.finance'] = finance;
  if (documentation !== undefined) updateData['Module.documentation'] = documentation;

  try {
    // Find and update the company by ID, only changing the provided fields
    const company = await Company.findByIdAndUpdate(
      id,
      { $set: updateData },  // Use $set to update only the provided fields
      { new: true }  // Return the updated company document
    );

    // If no company is found with the provided ID
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Return the updated company document
    res.status(200).json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating company modules', error: err });
  }
});


module.exports = router;
