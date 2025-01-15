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

// Toggle user activity
exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params; // Assuming the userId is passed as a route parameter
  const { isActive } = req.body; // The new status is sent in the request body

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "Invalid isActive value. Must be true or false." });
  }

  try {
    const user = await UserProfile.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      message: `User is now ${isActive ? "active" : "inactive"}.`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling user status.", error });
  }
};

// Controller to fetch active user details
exports.getPublicUsers = async (req, res) => {
  try {
    // Fetch all active users
    const activeUsers = await UserProfile.find({ company:req.user.company._id,isActive: true }).select(
      "email name firstName lastName phone role company createdAt"
    ).populate('company', 'name'); // Populate company name if needed

    // Respond with active users
    res.status(200).json({
      success: true,
      data: activeUsers,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Failed to fetch active users",
      error: error.message,
    });
  }
};










