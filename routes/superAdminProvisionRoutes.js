const express = require('express')
const User = require('../models/User')
const Company = require('../models/Company')

const router = express.Router()

/**
 * Internal Super Admin provisioning for multi-tenant onboarding.
 * Protected by shared secret header: x-super-admin-secret
 *
 * POST /api/super-admin/provision-tenant
 */
router.post('/provision-tenant', async (req, res) => {
  try {
    const expected = process.env.SUPER_ADMIN_PROVISION_SECRET
    const provided = req.headers['x-super-admin-secret']
    if (!expected || provided !== expected) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const {
      companyName,
      adminEmail,
      adminPassword,
      adminName = 'Company Admin',
      enabledModules = ['crm'],
    } = req.body || {}

    if (!companyName || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'companyName, adminEmail, adminPassword required' })
    }

    const email = String(adminEmail).trim().toLowerCase()
    let user = await User.findOne({ email })
    if (!user) {
      const nameParts = String(adminName).trim().split(/\s+/)
      user = await User.create({
        email,
        name: adminName,
        firstName: nameParts[0] || 'Admin',
        lastName: nameParts.slice(1).join(' ') || 'User',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      })
    } else {
      user.password = adminPassword
      user.role = 'admin'
      user.isActive = true
      user.isEmailVerified = true
      await user.save()
    }

    let company = await Company.findOne({ email })
    if (!company) {
      company = await Company.create({
        name: companyName,
        email,
        phone: '',
        industry: 'General',
        employees: 1,
        Module: {
          Customer: true,
          lead: true,
          pipeline: true,
          finance: enabledModules.includes('finance'),
          documentation: true,
        },
        enabledProducts: enabledModules,
      })
    }

    if (!user.company || String(user.company) !== String(company._id)) {
      user.company = company._id
      await user.save()
    }

    return res.status(201).json({
      message: 'Legacy tenant provisioned',
      companyId: company._id,
      userId: user._id,
      email: user.email,
    })
  } catch (err) {
    console.error('provision-tenant error', err)
    return res.status(500).json({ message: err.message || 'Provision failed' })
  }
})

module.exports = router
