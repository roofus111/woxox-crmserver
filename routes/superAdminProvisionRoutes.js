const express = require('express')
const User = require('../models/User')
const Company = require('../models/Company')
const { ensureCompanyPlan } = require('../utils/ensureCompanyPlan')

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
        address: {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          country: 'IN',
          postalCode: '000000',
        },
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

    await ensureCompanyPlan(company._id)

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

/**
 * Mint a one-time handoff token so Super Admin can open the customer CRM session.
 * POST /api/super-admin/impersonate-handoff
 * Body: { adminEmail, actorEmail?, reason? }
 */
router.post('/impersonate-handoff', async (req, res) => {
  try {
    const expected = process.env.SUPER_ADMIN_PROVISION_SECRET
    const provided = req.headers['x-super-admin-secret']
    if (!expected || provided !== expected) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const crypto = require('crypto')
    const ImpersonationHandoff = require('../models/ImpersonationHandoff')
    const { adminEmail, actorEmail, reason } = req.body || {}
    if (!adminEmail) {
      return res.status(400).json({ message: 'adminEmail required' })
    }

    const email = String(adminEmail).trim().toLowerCase()
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'Legacy admin user not found for this email' })
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Legacy user is inactive' })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await ImpersonationHandoff.create({
      tokenHash,
      userId: user._id,
      actorEmail: actorEmail || null,
      reason: reason || 'super-admin-legacy-open',
      expiresAt,
    })

    return res.status(201).json({
      message: 'Handoff token created',
      handoffToken: rawToken,
      expiresAt,
      email: user.email,
      userId: user._id,
      companyId: user.company,
    })
  } catch (err) {
    console.error('impersonate-handoff error', err)
    return res.status(500).json({ message: err.message || 'Handoff failed' })
  }
})

/**
 * Sync a published platform pipeline into legacy Mongo so Campaign / workflow boards keep working.
 * POST /api/super-admin/sync-pipeline
 * Body: { legacyMongoId?, name, description?, companyEmail?, stages: [{ name, description?, property, order }] }
 */
router.post('/sync-pipeline', async (req, res) => {
  try {
    const expected = process.env.SUPER_ADMIN_PROVISION_SECRET
    const provided = req.headers['x-super-admin-secret']
    if (!expected || provided !== expected) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const Pipeline = require('../models/pipeline')
    const { legacyMongoId, name, description, companyEmail, stages = [] } = req.body || {}

    if (!name || !Array.isArray(stages)) {
      return res.status(400).json({ message: 'name and stages[] required' })
    }

    const mappedStages = stages.map((s, i) => ({
      name: s.name,
      description: s.description || '',
      property: ['Pending', 'Processing', 'Won', 'Lost'].includes(s.property)
        ? s.property
        : 'Pending',
      status: 'Not Started',
      order: typeof s.order === 'number' ? s.order : i,
    }))

    let company = null
    if (companyEmail) {
      company = await Company.findOne({ email: String(companyEmail).trim().toLowerCase() })
    }

    let pipeline = null
    if (legacyMongoId) {
      pipeline = await Pipeline.findById(legacyMongoId)
    }

    // Prefer matching existing by company + name so republish does not create duplicates
    if (!pipeline && company) {
      pipeline = await Pipeline.findOne({ company: company._id, name })
    }
    if (!pipeline && companyEmail) {
      const owner = await User.findOne({ email: String(companyEmail).trim().toLowerCase() })
      if (owner?.company) {
        pipeline = await Pipeline.findOne({ company: owner.company, name })
      }
    }

    if (pipeline) {
      pipeline.name = name
      pipeline.description = description || pipeline.description || ''
      pipeline.stages = mappedStages
      if (company) pipeline.company = company._id
      await pipeline.save()
    } else {
      let owner = null
      if (company) {
        owner = await User.findOne({ company: company._id, role: 'admin' })
        if (!owner) owner = await User.findOne({ company: company._id })
      }
      if (!owner && companyEmail) {
        owner = await User.findOne({ email: String(companyEmail).trim().toLowerCase() })
      }
      if (!owner) {
        return res.status(400).json({
          message: 'Cannot create legacy pipeline without a matching company admin (pass companyEmail)',
        })
      }

      pipeline = await Pipeline.create({
        name,
        description: description || '',
        stages: mappedStages,
        company: company?._id || owner.company,
        User: owner._id,
      })
    }

    return res.status(200).json({
      message: 'Pipeline synced to legacy Mongo',
      mongoId: String(pipeline._id),
      _id: String(pipeline._id),
    })
  } catch (err) {
    console.error('sync-pipeline error', err)
    return res.status(500).json({ message: err.message || 'Sync failed' })
  }
})

module.exports = router
