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
