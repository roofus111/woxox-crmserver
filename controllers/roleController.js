// controllers/roleController.js
const Role = require('../models/Role');

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const { name, code, description, scope, permissions, department } = req.body;

    const newRole = new Role({
      name,
      code,
      description,
      scope,
      permissions,
      department,
      createdBy: req.user._id, // Assuming you have user info in req.user
    });

    const savedRole = await newRole.save();
    res.status(201).json(savedRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

