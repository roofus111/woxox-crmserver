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


