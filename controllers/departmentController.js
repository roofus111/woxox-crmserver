const Department = require('../models/Department');

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, head, teams, tags } = req.body;

    // Optional: check for required fields if not handled in schema
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required.' });
    }

    const department = new Department({
      name,
      code,
      description,
      head,
      teams,
      tags,
      createdBy: req.user?._id, // assumes you have user info in req.user
    });

    const savedDepartment = await department.save();
    res.status(201).json(savedDepartment);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `Duplicate ${field} found.` });
    }

    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params; // Assuming the ID is passed as a URL parameter
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    res.status(200).json(department);
  } catch (error) {
    console.error('Error fetching department by ID:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params; // Get the department ID from the request parameters
    const updates = req.body; // Get the updates from the request body

    const updatedDepartment = await Department.findByIdAndUpdate(id, updates, {
      new: true, // Return the updated document
      runValidators: true, // Validate the updates against the schema
    });

    if (!updatedDepartment) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    res.status(200).json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params; // Get the department ID from the request parameters

    const deletedDepartment = await Department.findByIdAndDelete(id);

    if (!deletedDepartment) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    res.status(204).send('Department deleted successfully'); // No content to send back
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};