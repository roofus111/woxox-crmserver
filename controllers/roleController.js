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
// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// Update role by ID
exports.updateRole = async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(updatedRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete role by ID
exports.deleteRole = async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};