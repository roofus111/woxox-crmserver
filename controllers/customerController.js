const Customer = require("../models/Customer"); // Adjust the path as needed

exports.createCustomer = async (req, res) => {
  try {
    // Extract customer data from the request body
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      status,
      notes
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    // Create a new customer instance
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      status,
      notes
    });

    // Save the customer to the database
    const savedCustomer = await newCustomer.save();

    // Respond with the saved customer
    res.status(201).json({
      message: 'Customer created successfully',
      customer: savedCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);

    // Check for duplicate email
    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Handle other errors
    res.status(500).json({
      error: 'An error occurred while creating the customer',
      details: error.message
    });
  }
};


// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    // Fetch all customers from the database
    const customers = await Customer.find();

    res.status(200).json({
      message: 'Customers retrieved successfully',
      customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving customers',
      details: error.message
    });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    // Fetch the customer by ID
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer retrieved successfully',
      customer
    });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving the customer',
      details: error.message
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    // Validate that updates are not empty
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    // Find and update the customer
    const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, {
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
    const { id } = req.params;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    // Find and delete the customer by ID
    const deletedCustomer = await Customer.findByIdAndDelete(id);

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
