const jwt = require('jsonwebtoken');
const UserProfile = require('../models/User');

const authenticateUser = async (req, res, next) => {
  try {
    console.log(req.header);
    
    const token = req.header('Authorization').replace('Bearer ', '');
   
    
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded);
    const user = await UserProfile.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authenticateUser; // Ensure it is exported as a middleware function
