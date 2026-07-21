const Project = require('../models/Project')
const Task = require('../models/Task')
const Pipeline = require('../models/pipeline')

function companyIdOf(user) {
  const c = user?.company
  if (!c) return null
  return typeof c === 'object' && c._id ? c._id : c
}

function requireCompany(req, res) {
  const company = companyIdOf(req.user)
  if (!company) {
    res.status(400).json({
      message: 'No company on user. Re-login after demo seed, or attach a company to this account.'
    })
    return null
  }
  return company
}

/** Dashboard KPIs for Lite / Max workspaces */
exports.getWorkspaceSummary = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const edition = req.query.edition // 'lite' | 'max' | undefined

    const projectFilter = { company, archivedAt: null }
    if (edition === 'lite' || edition === 'max') projectFilter.edition = edition

    const [projects, tasks, pipelines] = await Promise.all([
      Project.find(projectFilter).select('name status priority startDate endDate edition members milestones').lean(),
      Task.find({ company }).select('status priority dueDate projectId assignee completedAt createdAt').lean(),
      Pipeline.find({ company }).select('name').lean()
    ])

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const byStatus = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {})

    const overdue = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed' && t.status !== 'Cancelled'
    ).length

    const completedThisWeek = tasks.filter(
      t => t.status === 'Completed' && t.completedAt && new Date(t.completedAt) >= weekAgo
    ).length

    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning').length
    const openTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length

    res.status(200).json({
      edition: edition || 'all',
      counts: {
        projects: projects.length,
        activeProjects,
        tasks: tasks.length,
        openTasks,
        overdue,
        completedThisWeek,
        pipelines: pipelines.length,
        byStatus
      },
      projects: projects.slice(0, 12),
      pipelines,
      recentOpenTasks: tasks
        .filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 8)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.listProjects = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const filter = { company }
    if (req.query.status) filter.status = req.query.status
    if (req.query.edition) filter.edition = req.query.edition
    if (req.query.archived === '1') {
      filter.archivedAt = { $ne: null }
    } else {
      filter.archivedAt = null
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('pipelineIds', 'name')
      .sort({ updatedAt: -1 })

    res.status(200).json(projects)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getProject = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const project = await Project.findOne({ _id: req.params.id, company })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('pipelineIds', 'name')
      .populate('createdBy', 'name email')

    if (!project) return res.status(404).json({ message: 'Project not found' })

    const tasks = await Task.find({ company, projectId: project._id })
      .populate('assignee', 'name')
      .sort({ updatedAt: -1 })

    res.status(200).json({ project, tasks })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createProject = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const {
      name,
      code,
      description,
      status,
      priority,
      startDate,
      endDate,
      owner,
      members,
      pipelineIds,
      tagIds,
      edition,
      milestones
    } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Project name is required' })
    }

    const project = await Project.create({
      company,
      name: name.trim(),
      code,
      description,
      status: status || 'planning',
      priority: priority || 'medium',
      startDate,
      endDate,
      owner: owner || req.user._id,
      members: members?.length
        ? members
        : [{ user: req.user._id, role: 'owner' }],
      pipelineIds: pipelineIds || [],
      tagIds: tagIds || [],
      edition: edition === 'max' ? 'max' : 'lite',
      milestones: milestones || [],
      createdBy: req.user._id
    })

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')

    res.status(201).json(populated)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateProject = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const allowed = [
      'name',
      'code',
      'description',
      'status',
      'priority',
      'startDate',
      'endDate',
      'owner',
      'members',
      'pipelineIds',
      'tagIds',
      'edition',
      'milestones'
    ]
    const patch = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key]
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company },
      { $set: patch },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('pipelineIds', 'name')

    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.status(200).json(project)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.archiveProject = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company },
      { $set: { archivedAt: new Date(), status: 'cancelled' } },
      { new: true }
    )
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.status(200).json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.addMilestone = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const { title, description, dueDate, status } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Milestone title required' })

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company },
      {
        $push: {
          milestones: {
            title: title.trim(),
            description,
            dueDate,
            status: status || 'planned'
          }
        }
      },
      { new: true }
    )
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.status(201).json(project)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateMilestone = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const project = await Project.findOne({ _id: req.params.id, company })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const milestone = project.milestones.id(req.params.milestoneId)
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' })

    const { title, description, dueDate, status } = req.body
    if (title !== undefined) milestone.title = title
    if (description !== undefined) milestone.description = description
    if (dueDate !== undefined) milestone.dueDate = dueDate
    if (status !== undefined) {
      milestone.status = status
      milestone.completedAt = status === 'done' ? new Date() : undefined
    }

    await project.save()
    res.status(200).json(project)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.addMember = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const { userId, role } = req.body
    if (!userId) return res.status(400).json({ message: 'userId required' })

    const project = await Project.findOne({ _id: req.params.id, company })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const exists = project.members.some(m => m.user.toString() === String(userId))
    if (exists) return res.status(400).json({ message: 'Member already on project' })

    project.members.push({ user: userId, role: role || 'member' })
    await project.save()

    const populated = await Project.findById(project._id).populate('members.user', 'name email')
    res.status(200).json(populated)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.removeMember = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company },
      { $pull: { members: { user: req.params.userId } } },
      { new: true }
    ).populate('members.user', 'name email')

    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.status(200).json(project)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/** Link existing tasks to a project (Max) */
exports.linkTasks = async (req, res) => {
  try {
    const company = requireCompany(req, res)
    if (!company) return
    const { taskIds } = req.body
    if (!Array.isArray(taskIds) || !taskIds.length) {
      return res.status(400).json({ message: 'taskIds array required' })
    }

    const project = await Project.findOne({ _id: req.params.id, company })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, company },
      { $set: { projectId: project._id } }
    )

    res.status(200).json({ linked: result.modifiedCount, projectId: project._id })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
