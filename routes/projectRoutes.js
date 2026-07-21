const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authenticateUser')
const authorizeCompanyAccess = require('../middleware/authorizeCompanyAccess')
const { authorizeProduct, authorizeRoles } = require('../middleware/authorizeProduct')
const projectController = require('../controllers/projectController')

router.use(authenticateUser)
router.use(authorizeCompanyAccess)

// Workspace summary — Lite or Max (Max product covers both)
router.get(
  '/workspace/summary',
  authorizeProduct('projectsLite', 'projectsMax'),
  projectController.getWorkspaceSummary
)

router.get(
  '/',
  authorizeProduct('projectsLite', 'projectsMax'),
  projectController.listProjects
)

router.post(
  '/',
  authorizeProduct('projectsLite', 'projectsMax'),
  authorizeRoles('admin', 'pipeline', 'user', 'guest'),
  projectController.createProject
)

router.get(
  '/:id',
  authorizeProduct('projectsLite', 'projectsMax'),
  projectController.getProject
)

router.put(
  '/:id',
  authorizeProduct('projectsLite', 'projectsMax'),
  authorizeRoles('admin', 'pipeline', 'user'),
  projectController.updateProject
)

router.delete(
  '/:id',
  authorizeProduct('projectsLite', 'projectsMax'),
  authorizeRoles('admin', 'pipeline'),
  projectController.archiveProject
)

router.post(
  '/:id/milestones',
  authorizeProduct('projectsLite', 'projectsMax'),
  projectController.addMilestone
)

router.put(
  '/:id/milestones/:milestoneId',
  authorizeProduct('projectsLite', 'projectsMax'),
  projectController.updateMilestone
)

router.post(
  '/:id/members',
  authorizeProduct('projectsMax'),
  authorizeRoles('admin', 'pipeline', 'user'),
  projectController.addMember
)

router.delete(
  '/:id/members/:userId',
  authorizeProduct('projectsMax'),
  authorizeRoles('admin', 'pipeline'),
  projectController.removeMember
)

router.post(
  '/:id/link-tasks',
  authorizeProduct('projectsLite', 'projectsMax'),
  projectController.linkTasks
)

module.exports = router
