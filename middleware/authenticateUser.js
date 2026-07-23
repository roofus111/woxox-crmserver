const jwt = require('jsonwebtoken')
const UserProfile = require('../models/User')
const { resolveUserCompany } = require('../utils/resolveUserCompany')

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
    let user = await UserProfile.findById(decoded.id).populate('company')

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    if (!user.company) {
      try {
        await resolveUserCompany(user)
        user = await UserProfile.findById(decoded.id).populate('company')
      } catch (linkErr) {
        console.error('authenticateUser: company link skipped', linkErr.message)
      }
    }

    req.user = user
    next()
  } catch (error) {
    console.error('authenticateUser failed:', error.message)
    return res.status(401).json({ message: 'Authentication failed' })
  }
}

module.exports = authenticateUser
