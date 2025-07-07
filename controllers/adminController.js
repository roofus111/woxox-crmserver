const Admin = require('../models/Admin'); // adjust path as needed

// POST /admin
exports.createAdmin = async (req, res) => {
  try {
    const {
      adminName,
      numberOfClients,
      plans, // array of plan IDs
      dateOfExpiry,
      billings,
      paymentHistory
    } = req.body;

    // Validate required fields
    if (!adminName || !dateOfExpiry) {
      return res.status(400).json({ message: 'adminName and dateOfExpiry are required' });
    }

    // Build the admin object
    const admin = new Admin({
      adminName,
      numberOfClients,
      plans,
      dateOfExpiry,
      billings,
      paymentHistory
    });

    // Save to DB
    const savedAdmin = await admin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: savedAdmin
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      message: 'Server error while creating admin',
      error: error.message
    });
  }
};


