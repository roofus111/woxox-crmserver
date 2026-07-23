const mongoose = require('mongoose')
const { resolveUserCompany, ensureCompanyPlan } = require('../utils/resolveUserCompany')
const User = require('../models/User')

const email = process.argv[2] || 'drmattappallyroofus@gmail.com'

;(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    console.log('user not found:', email)
    process.exit(0)
  }
  const companyId = await resolveUserCompany(user)
  if (companyId) await ensureCompanyPlan(companyId)
  console.log('OK linked', email, 'to company', companyId)
  await mongoose.disconnect()
})().catch(err => {
  console.error(err)
  process.exit(1)
})
