const jwt = require('jsonwebtoken')
const UserProfile = require('../models/User')

/**
 * JWT auth — requires Authorization: Bearer <token>
 * Populates company for product / company-scoped routes.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const header = req.header('Authorization')
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = header.slice(7).trim()
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await UserProfile.findById(decoded.id).populate('company')

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' })
  }
}

module.exports = authenticateUser
