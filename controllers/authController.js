const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const userProfile = new User({
      ...req.body
    });
  
    try {
      const newProfile = await userProfile.save();
      res.status(201).json(newProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET,  { expiresIn: '10h' } );
        res.status(200).json({ token, role: user.role,id:user._id,user: user.firstName+" "+user.lastName});
    } catch (err) {
        res.status(500).json({ error: 'Error logging in user' });
    }
};
// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email, active: true });
      
//       if (!user || !(await user.comparePassword(password))) {
//           return res.status(401).json({ message: 'Invalid email or password' });
//       }

//       // Check if the user is active
//       if (!user.active) {
//           return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
//       }

//       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '10h' });
//       res.status(200).json({ token, role: user.role, id: user._id, user: user.firstName + " " + user.lastName });
//   } catch (err) {
//       res.status(500).json({ error: 'Error logging in user' });
//   }
// };

exports.changePassword = async (req, res) => {
  try {
    const { _id: user_id } = req.user;
// Assumes authentication middleware sets `req.user`
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    // Fetch user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by the `pre` save middleware
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error changing password", error: err.message });
  }
};

