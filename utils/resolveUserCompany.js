const Company = require('../models/Company')
const { CompanyPurchase } = require('../models/Plan')

/**
 * Ensure a legacy Mongo user is linked to a company (by email match or create).
 * @returns {Promise<import('mongoose').Types.ObjectId|null>}
 */
async function resolveUserCompany(user) {
  if (!user) return null

  if (user.company) {
    return typeof user.company === 'object' && user.company._id
      ? user.company._id
      : user.company
  }

  const email = String(user.email || '').trim().toLowerCase()
  if (!email) return null

  let company = await Company.findOne({ email })
  if (!company) {
    company = await Company.create({
      name: user.name || `${user.firstName || 'My'} Company`.trim(),
      email,
      phone: user.phone || '',
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
        finance: false,
        documentation: true,
      },
      enabledProducts: ['crm'],
    })
  }

  user.company = company._id
  try {
    await user.save()
  } catch (err) {
    console.error('resolveUserCompany: failed to link user to company', err.message)
  }
  return company._id
}

/** Default trial plan so team/employee APIs work after platform signup. */
async function ensureCompanyPlan(companyId, { employeeLimit = 25 } = {}) {
  if (!companyId) return null

  let plan = await CompanyPurchase.findOne({ companyId })
  if (plan) return plan

  plan = await CompanyPurchase.create({
    companyId,
    planType: 'free trial',
    status: 'active',
    modules: [
      {
        moduleName: 'CRM',
        plans: [
          {
            planName: 'Trial',
            price: 0,
            durationMonths: 1,
            employeeLimit,
            leadLimit: 2000,
            campaignLimit: 5,
            moduleAccess: [],
            isActive: true,
          },
        ],
      },
    ],
  })

  return plan
}

module.exports = { resolveUserCompany, ensureCompanyPlan }
