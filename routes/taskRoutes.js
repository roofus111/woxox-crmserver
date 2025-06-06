/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - assignee
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the task
 *         description:
 *           type: string
 *           description: Detailed description of the task
 *         assignee:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the assigned user
 *         leadId:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the associated lead
 *         status:
 *           type: string
 *           enum: [todo, in progress, completed]
 *           default: todo
 *           description: Current status of the task
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *           description: Priority level of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the task
 *         tagIds:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *           description: Array of tag references
 *         activityLog:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               performedBy:
 *                 type: string
 *                 format: ObjectId
 *                 description: Reference to the user who performed the action
 *               action:
 *                 type: string
 *                 description: The action performed
 *               referenceData:
 *                 type: object
 *                 description: Additional context for the action
 *               performedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the action was performed
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Name of the file
 *               originalName:
 *                 type: string
 *                 description: Original name of the file
 */

/**
 * @swagger
 * /api/tasks/createTask:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/getalltasks:
 *   get:
 *     summary: Get all tasks
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/gettask/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/updatetask/{id}:
 *   put:
 *     summary: Update a task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/deletetask/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/reassign/{taskId}:
 *   put:
 *     summary: Reassign a task to a different user
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignee
 *             properties:
 *               assignee:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the new assignee
 *     responses:
 *       200:
 *         description: Task reassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     summary: Search and filter tasks
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in progress, completed]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by task priority
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *         description: Filter by assignee ID
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Filter by lead ID
 *     responses:
 *       200:
 *         description: List of filtered tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tasks/uploadfile/{taskId}:
 *   post:
 *     summary: Upload a file to a task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tasks/deletefile/{taskId}/{fileId}:
 *   delete:
 *     summary: Delete a file from a task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: Task or file not found
 *       401:
 *         description: Unauthorized
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateUser = require('../middleware/authenticateUser');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateUser);

router.post('/createTask', taskController.createTask);
router.get('/getalltasks', taskController.getAllTasks);
router.get('/gettask/:id', taskController.getTaskById);
router.put('/updatetask/:id', taskController.updateTask);
router.delete('/deletetask/:id', taskController.deleteTask);
router.put('/reassign/:taskId', taskController.reassignTask);
router.get('/search', taskController.searchAndFilterTasks);
router.post('/uploadfile/:taskId', upload.single('file'), taskController.uploadTaskFile);
router.delete('/deletefile/:taskId/:fileId', taskController.deleteTaskFile);


module.exports = router;