const UserProfile = require('../models/User');

// Get all profiles within the user's company
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await UserProfile.find({ company: req.user.company._id });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user profile
exports.createProfile = async (req, res) => {
  console.log(req.body);
  
  const userProfile = new UserProfile({
    ...req.body,
    company: req.user.company._id
  });

  try {
    const newProfile = await userProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const { userid } = req.params;
    const profile = await UserProfile.findOne({ 
      _id: userid, 
      company: req.user.company._id 
    });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller to update profile by ID
exports.updateProfileById = async (req, res) => {
  try {
    const { userid } = req.params;
    const updates = req.body; // Get the updated fields from the request body

    // Check if the profile exists
    const profile = await UserProfile.findOne({ 
      _id: userid, 
      company: req.user.company._id 
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update the profile
    Object.keys(updates).forEach((key) => {
      profile[key] = updates[key];
    });

    // Save the updated profile
    await profile.save();

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const User = require('../models/User');

// Toggle User Activation
exports.toggleUserActivation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // action can be 'activate' or 'deactivate'

    // Validate action
    if (!['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "activate" or "deactivate".' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the isActive field based on the action
    user.isActive = action === 'activate';

    await user.save();

    const status = user.isActive ? 'activated' : 'deactivated';
    res.status(200).json({ message: `User ${status} successfully`, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




