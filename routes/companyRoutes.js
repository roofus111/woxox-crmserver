const express = require('express');
const router = express.Router();
const Company=require("../models/Company")
const companyController = require('../controllers/companyController');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeCompanyAccess = require('../middleware/authorizeCompanyAccess');

router.use(authenticateUser); // Apply authentication to all routes
router.get('/', companyController.getCompanyById);
router.get('/getall', companyController.getAllCompanies);
router.post('/', companyController.createCompany);
router.put('/', authorizeCompanyAccess, companyController.updateCompany);
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
