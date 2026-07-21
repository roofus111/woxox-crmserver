/**
 * Start CRM server with mongodb-memory-server (no local Mongo install).
 * Usage: node scripts/start-memory.js
 */
const { MongoMemoryServer } = require('mongodb-memory-server')

async function seedDemo(mongoose) {
  const User = require('../models/User')
  const Company = require('../models/Company')
  const Project = require('../models/Project')
  const Task = require('../models/Task')
  const Pipeline = require('../models/pipeline')

  let company = await Company.findOne({ email: 'admin@woxox.local' })
  if (!company) {
    company = await Company.create({
      name: 'WOXOX Demo Co',
      email: 'admin@woxox.local',
      phone: '+91-0000000000',
      industry: 'Software',
      employees: 25,
      address: {
        street: '1 Demo Street',
        city: 'Bengaluru',
        state: 'KA',
        country: 'IN',
        postalCode: '560001'
      },
      Module: {
        Customer: true,
        lead: true,
        pipeline: true,
        finance: true,
        documentation: true
      },
      enabledProducts: [
        'crm',
        'projectsLite',
        'projectsMax',
        'finance',
        'hrms',
        'legalos',
        'academy',
        'ecommerce'
      ]
    })
    console.log('[crmserver] Seeded demo company', company._id.toString())
  }

  let admin = await User.findOne({ email: 'admin@woxox.local' })
  if (!admin) {
    admin = await User.create({
      email: 'admin@woxox.local',
      name: 'WOXOX Admin',
      firstName: 'WOXOX',
      lastName: 'Admin',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      company: company._id
    })
    console.log('[crmserver] Seeded admin@woxox.local / admin123')
  } else if (!admin.company) {
    admin.company = company._id
    await admin.save()
    console.log('[crmserver] Attached company to existing demo admin')
  }

  let pipeline = await Pipeline.findOne({ company: company._id, name: 'Delivery Pipeline' })
  if (!pipeline) {
    pipeline = await Pipeline.create({
      name: 'Delivery Pipeline',
      company: company._id,
      User: admin._id,
      stages: [
        { name: 'Backlog', order: 1 },
        { name: 'In Progress', order: 2 },
        { name: 'Review', order: 3 },
        { name: 'Done', order: 4 }
      ]
    })
    console.log('[crmserver] Seeded Delivery Pipeline')
  }

  let liteProject = await Project.findOne({ company: company._id, name: 'Lite Onboarding', edition: 'lite' })
  if (!liteProject) {
    liteProject = await Project.create({
      company: company._id,
      name: 'Lite Onboarding',
      code: 'LITE-01',
      description: 'Sample Lite project for task delivery',
      status: 'active',
      priority: 'medium',
      edition: 'lite',
      owner: admin._id,
      members: [{ user: admin._id, role: 'owner' }],
      milestones: [{ title: 'Kickoff', status: 'done' }, { title: 'First delivery', status: 'planned' }],
      pipelineIds: [pipeline._id],
      createdBy: admin._id
    })
    console.log('[crmserver] Seeded Lite sample project')
  }

  let maxProject = await Project.findOne({ company: company._id, name: 'Max Enterprise Rollout', edition: 'max' })
  if (!maxProject) {
    maxProject = await Project.create({
      company: company._id,
      name: 'Max Enterprise Rollout',
      code: 'MAX-01',
      description: 'Sample Max project with boards, docs & pipelines',
      status: 'active',
      priority: 'high',
      edition: 'max',
      owner: admin._id,
      members: [{ user: admin._id, role: 'owner' }],
      milestones: [
        { title: 'Discovery', status: 'done' },
        { title: 'Build', status: 'in_progress' },
        { title: 'Go-live', status: 'planned' }
      ],
      pipelineIds: [pipeline._id],
      createdBy: admin._id
    })
    console.log('[crmserver] Seeded Max sample project')
  }

  const taskCount = await Task.countDocuments({ company: company._id })
  if (taskCount === 0) {
    await Task.insertMany([
      {
        company: company._id,
        title: 'Set up team workspace',
        description: 'Invite members and configure tags',
        status: 'Open',
        priority: 'high',
        assignee: [admin._id],
        projectId: liteProject._id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        activityLog: [{ performedBy: admin._id, action: 'created' }]
      },
      {
        company: company._id,
        title: 'Draft delivery checklist',
        description: 'Prepare Max go-live checklist',
        status: 'Pending',
        priority: 'medium',
        assignee: [admin._id],
        projectId: maxProject._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        activityLog: [{ performedBy: admin._id, action: 'created' }]
      },
      {
        company: company._id,
        title: 'Completed sample task',
        description: 'Shows up in weekly done KPI',
        status: 'Completed',
        priority: 'low',
        assignee: [admin._id],
        projectId: liteProject._id,
        completedAt: new Date(),
        activityLog: [{ performedBy: admin._id, action: 'created' }]
      }
    ])
    console.log('[crmserver] Seeded sample tasks')
  }

  console.log('[crmserver] Demo ready → admin@woxox.local / admin123')
}

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'woxox_crm' }
  })
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'woxox-crm-local-jwt-secret-change-in-prod-32chars'
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'woxox-crm-local-refresh-secret-change-in-prod-32'
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
  process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

  console.log('[crmserver] Memory Mongo ready:', uri)

  require('../index.js')

  setTimeout(async () => {
    try {
      const mongoose = require('mongoose')
      if (mongoose.connection.readyState !== 1) {
        console.warn('[crmserver] Waiting for Mongo connection to seed...')
        await new Promise(resolve => mongoose.connection.once('open', resolve))
      }
      await seedDemo(mongoose)
    } catch (e) {
      console.error('[crmserver] Seed failed:', e.message)
      console.error(e)
    }
  }, 2500)

  const shutdown = async () => {
    console.log('[crmserver] Shutting down memory Mongo...')
    await mongod.stop()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(err => {
  console.error('[crmserver] Failed to start:', err)
  process.exit(1)
})
