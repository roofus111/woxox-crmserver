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

// GET /api/teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('department').populate('members');
    res.status(200).json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error while fetching teams' });
  }
};

// GET /api/teams/:id
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id).populate('department').populate('members');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching team by ID:', error);
    res.status(500).json({ message: 'Server error while fetching team' });
  }
};

// PUT /api/teams/:id
exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedTeam = await Team.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('department').populate('members');

    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error while updating team' });
  }
};

// DELETE /api/teams/:id
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTeam = await Team.findByIdAndDelete(id);

    if (!deletedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Server error while deleting team' });
  }
};


