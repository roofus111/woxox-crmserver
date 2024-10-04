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

// Create a new company
exports.createCompany = async (req, res) => {
  const { name, website, address, phone, email, industry, employees } = req.body;

  // Validation
  if (!name || !email) {
    return res.status(400).json({ message: 'Company name and email are required' });
  }

  // Create the company
  const company = new Company({
    name,
    website,
    address,
    phone,
    email,
    industry,
    employees
  });

  try {
    // Save the new company
    const newCompany = await company.save();

    // Update the user's role to 'admin' and associate them with the new company
    const user = await UserProfile.findById(req.user._id); // Assuming req.user is set by authenticateUser
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin'; // Set role to admin
    user.company = newCompany._id; // Associate user with the new company

    await user.save(); // Save the updated user

    // Respond with the new company and updated user info
    res.status(201).json({ newCompany, user });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: err.message });
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
