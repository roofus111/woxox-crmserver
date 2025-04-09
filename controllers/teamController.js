const Team = require('../models/Team'); // Adjust path if needed

// POST /api/teams
exports.createTeam = async (req, res) => {
  try {
    const {
      name,
      description,
      department,
      members = [],
      tags = []
    } = req.body;

    // Basic validation (optional, can also use a validation library like Joi)
    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required.' });
    }

    const newTeam = new Team({
      name,
      description,
      department,
      members,
      tags
    });

    const savedTeam = await newTeam.save();

    res.status(201).json({
      message: 'Team created successfully',
      team: savedTeam
    });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error while creating team' });
  }
};


