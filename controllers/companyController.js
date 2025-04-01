const Company = require('../models/Company');
const UserProfile = require('../models/User');

// Get the authenticated user's company
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find(); // Fetch all companies from the database

    if (!companies || companies.length === 0) {
      return res.status(404).json({ message: 'No companies found' });
    }

    res.status(200).json(companies); // Return all companies
  } catch (err) {
    console.error(err); // Optional logging
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Create a new company with a profile image
exports.createCompany = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, website, phone, email, industry, employees, address } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Company name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate address
    if (!address || !address.street || !address.city || !address.state || !address.country || !address.postalCode) {
      return res.status(400).json({ message: 'Complete address details are required' });
    }

    // Check if the company already exists
    const existingCompany = await Company.findOne({ email }).session(session);
    if (existingCompany) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // Handle profile image upload
    let profileImageUrl = '';
    if (req.file) {
      profileImageUrl = `/uploads/${req.file.filename}`;
    }

    // Create the company
    const company = new Company({
      name,
      website,
      phone,
      email,
      industry,
      employees,
      profileImage: profileImageUrl, // Store profile image URL
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
      },
    });

    const newCompany = await company.save({ session });

    // Update user role and associate with the company
    const user = await UserProfile.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    user.company = newCompany._id;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ newCompany, user });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating company:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update company details (Only the authenticated user's company)
exports.updateCompany = async (req, res) => {
  const updates = req.body;

  try {
    const updatedCompany = await Company.findByIdAndUpdate(req.user.company._id, updates, { new: true });

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(updatedCompany);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete the authenticated user's company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.user.company._id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Module Controller
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params; // Assuming the document ID is passed as a URL parameter
    const updates = req.body; // Assuming the updated data is sent in the request body

    // Find the document by ID and update it
    const updatedModule = await Company.findByIdAndUpdate(
      id,
      { $set: updates }, // Updates the specified fields
      { new: true, runValidators: true } // Return the updated document and validate fields
    );

    if (!updatedModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.status(200).json({
      message: 'Module updated successfully',
      data: updatedModule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

