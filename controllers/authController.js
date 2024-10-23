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
        res.status(200).json({ token, role: user.role,id:user._id });
    } catch (err) {
        res.status(500).json({ error: 'Error logging in user' });
    }
};
