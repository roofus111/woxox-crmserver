const mongoose = require('mongoose');
const Customer = require("../models/Customer"); // Adjust the path as needed
const Sales = require("../models/sales")
const Lead = require("../models/Lead")
exports.createCustomer = async (req, res) => {
  try {
    // Extract customer data from the request body
    const {
      firstName,
      lastName,
      email,
      phone,
      qualification,
      occupation,
      address,
      dateOfBirth,
      gender,
      customerType,
      source,
      priority,
      status,
      handledby,
      receivedDate,
      payment,
      notes,
      tags
    } = req.body;

    // Enhanced validation for required fields
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ 
        error: 'First name, last name, and phone are required.',
        missingFields: {
          firstName: !firstName,
          lastName: !lastName,
          phone: !phone
        }
      });
    }

    // Enhanced email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Please provide a valid email address.',
          invalidField: 'email'
        });
      }
    }

    // Enhanced phone validation (basic format check)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return res.status(400).json({ 
        error: 'Please provide a valid phone number.',
        invalidField: 'phone'
      });
    }

    // Enhanced date validation
    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        return res.status(400).json({ 
          error: 'Please provide a valid date of birth (cannot be in the future).',
          invalidField: 'dateOfBirth'
        });
      }
    }

    if (receivedDate) {
      const receivedDateObj = new Date(receivedDate);
      if (isNaN(receivedDateObj.getTime())) {
        return res.status(400).json({ 
          error: 'Please provide a valid received date.',
          invalidField: 'receivedDate'
        });
      }
    }

    // Validate enum values
    const validGenders = ['Male', 'Female', 'Other'];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({ 
        error: 'Invalid gender value. Must be one of: Male, Female, Other',
        invalidField: 'gender'
      });
    }

    const validCustomerTypes = ['Prospect', 'Regular', 'VIP', 'Wholesale', 'Retail'];
    if (customerType && !validCustomerTypes.includes(customerType)) {
      return res.status(400).json({ 
        error: 'Invalid customer type. Must be one of: Prospect, Regular, VIP, Wholesale, Retail',
        invalidField: 'customerType'
      });
    }

    const validSources = ['Website', 'Referral', 'Social Media', 'Advertisement', 'Cold Call', 'Trade Show', 'Other'];
    if (source && !validSources.includes(source)) {
      return res.status(400).json({ 
        error: 'Invalid source. Must be one of: Website, Referral, Social Media, Advertisement, Cold Call, Trade Show, Other',
        invalidField: 'source'
      });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: 'Invalid priority. Must be one of: Low, Medium, High, Urgent',
        invalidField: 'priority'
      });
    }

    const validStatuses = ['Active', 'Inactive', 'Archived', 'Converted'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: Active, Inactive, Archived, Converted',
        invalidField: 'status'
      });
    }

    // Check for existing customer with same email or phone
    const existingCustomer = await Customer.findOne({
      company: req.user.company._id,
      $or: [
        { email: email?.toLowerCase() },
        { phone: phone }
      ]
    });

    if (existingCustomer) {
      const conflicts = [];
      if (existingCustomer.email === email?.toLowerCase()) conflicts.push('email');
      if (existingCustomer.phone === phone) conflicts.push('phone');
      
      return res.status(409).json({ 
        error: 'Customer with this email or phone already exists.',
        conflicts,
        existingCustomerId: existingCustomer._id
      });
    }

    // Prepare address object if provided
    let addressObj = null;
    if (address) {
      addressObj = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || ''
      };
    }

    // Update the customer creation to remove the payment object
    const newCustomer = new Customer({
      company: req.user.company._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.toLowerCase().trim(),
      phone: phone.trim(),
      qualification: qualification?.trim(),
      occupation: occupation?.trim(),
      address: addressObj,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      customerType: customerType || 'Prospect',
      source: source || 'Other',
      priority: priority || 'Medium',
      status: status || 'Active',
      handledby: handledby || req.user._id,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      notes: notes?.trim(),
      tags: tags || [],
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    // Save the customer to the database
    const savedCustomer = await newCustomer.save();

    // Add activity log entry for customer creation
    savedCustomer.activityLog.push({
      performedBy: req.user._id,
      action: 'created',
      details: `Customer ${firstName} ${lastName} created successfully`,
      performedAt: new Date()
    });

    await savedCustomer.save();

    // Populate the customer with referenced fields for better response
    const populatedCustomer = await Customer.findById(savedCustomer._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('handledby', 'firstName lastName email')
      .populate('tags', 'name color')
      .populate('company', 'name');

    // Respond with the saved customer
    res.status(201).json({
      message: 'Customer created successfully',
      customer: populatedCustomer,
      created: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating customer:', error);

    // Check for duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({  
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
        duplicateField: field
      });
    }

    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'An error occurred while creating the customer',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    // Fetch all customers from the database
    const customers = await Customer.find({ company: req.user.company._id });

    res.status(200).json({
      message: 'Customers retrieved successfully',
      customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving customers',
      details: error.message
    });s
  }
};


exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const updates = req.body;

    // // Validate ID format
    // if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    //   return res.status(400).json({ error: 'Invalid customer ID' });
    // }

    // Validate that updates are not empty
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    // Find and update the customer
    const updatedCustomer = await Customer.findByIdAndUpdate(customerId, updates, {
      new: true, // Return the updated document
      runValidators: true // Validate the updates against the schema
    });

    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);

    res.status(500).json({
      error: 'An error occurred while updating the customer',
      details: error.message
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate ID format
    if (!customerId || !customerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    // Find and delete the customer by ID
    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer deleted successfully',
      customer: deletedCustomer
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      error: 'An error occurred while deleting the customer',
      details: error.message
    });
  }
};


exports.getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate Customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    // Fetch Customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch Sales and Leads as arrays
    const sales = await Sales.find({ CustomerId: customer._id });
    const leads = await Lead.find({ Customer: customer._id }).populate("assignedTo", "_id firstName lastName")
                                                             .populate("campaignid","name")
    
    // Extract IDs as arrays
    const salesIds = sales;
    const leadIds = leads;

    // Response
    res.status(200).json({
      message: 'Customer details retrieved successfully',
      customer,
      salesIds,
      leadIds,
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving the customer details',
    });
  }
};

exports.getDocumentsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate Customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find all leads associated with this customer
    const leads = await Lead.find({ Customer: customerId });
    
    // Extract lead IDs
    const leadIds = leads.map(lead => lead._id);

    // Find all documents associated with these leads
    const Document = require('../models/document');
    let documents = [];
    
    if (leads && leads.length > 0) {
      documents = await Document.find({ leadId: { $in: leadIds } })
        .populate('leadId', 'name email phone status')
        .populate('createdBy', 'firstName lastName')
        .populate('tags', 'name color')
        .sort({ uploadedAt: -1 }); // Sort by upload date, newest first
    }

    // Also check if customer has documents directly associated
    if (customer.document && customer.document.length > 0) {
      const directDocuments = await Document.find({ _id: { $in: customer.document } })
        .populate('leadId', 'name email phone status')
        .populate('createdBy', 'firstName lastName')
        .populate('tags', 'name color')
        .sort({ uploadedAt: -1 });
      
      // Merge documents and remove duplicates
      const allDocuments = [...documents, ...directDocuments];
      const uniqueDocuments = allDocuments.filter((doc, index, self) => 
        index === self.findIndex(d => d._id.toString() === doc._id.toString())
      );
      
      documents = uniqueDocuments;
    }

    res.status(200).json({
      message: 'Documents retrieved successfully',
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      totalLeads: leads.length,
      totalDocuments: documents.length,
      document: documents
    });

  } catch (error) {
    console.error('Error fetching documents by customer:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving the documents',
      details: error.message
    });
  }
};

exports.getCustomerActivity = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate Customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    // Check if customer exists and belongs to the user's company
    const customer = await Customer.findOne({ 
      _id: customerId, 
      company: req.user.company._id 
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get activity log with populated user details
    const customerWithActivity = await Customer.findById(customerId)
      .populate('activityLog.performedBy', 'firstName lastName email')
      .select('firstName lastName email phone activityLog');

    // Sort activities by performedAt date (newest first)
    const sortedActivities = customerWithActivity.activityLog.sort((a, b) => 
      new Date(b.performedAt) - new Date(a.performedAt)
    );

    res.status(200).json({
      message: 'Customer activity retrieved successfully',
      customerId,
      customerName: `${customerWithActivity.firstName} ${customerWithActivity.lastName}`,
      customerEmail: customerWithActivity.email,
      customerPhone: customerWithActivity.phone,
      totalActivities: sortedActivities.length,
      activities: sortedActivities
    });

  } catch (error) {
    console.error('Error fetching customer activity:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving customer activity',
      details: error.message
    });
  }
};

