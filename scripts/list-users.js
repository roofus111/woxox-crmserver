const mongoose = require('mongoose')
const User = require('../models/User')

;(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  const users = await User.find().select('email company role firstName').limit(20)
  for (const u of users) console.log(u.email, u.role, u.company ? 'has-company' : 'NO-COMPANY')
  await mongoose.disconnect()
})().catch(e => { console.error(e); process.exit(1) })
