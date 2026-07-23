/**
 * @swagger
 * components:
 *   schemas:
 *     Stage:
 *       type: object
 *       required:
 *         - name
 *         - order
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the stage.
 *           example: Initial Contact
 *         description:
 *           type: string
 *           description: A brief description of the stage.
 *           example: First interaction with the client.
 *         status:
 *           type: string
 *           description: The current status of the stage.
 *           enum: [Not Started, In Progress, Completed]
 *           default: Not Started
 *           example: In Progress
 *         order:
 *           type: integer
 *           description: The position of the stage in the pipeline.
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the stage was created.
 *           example: 2025-01-22T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the stage was last updated.
 *           example: 2025-01-22T12:45:00Z
 * 
 *     Pipeline:
 *       type: object
 *       required:
 *         - company
 *         - User
 *         - name
 *         - stages
 *       properties:
 *         company:
 *           type: string
 *           description: The ID of the associated company.
 *           example: 64c8f4c5f1b3f320ac9d1234
 *         User:
 *           type: string
 *           description: The ID of the associated sales representative.
 *           example: 64c8f4c5f1b3f320ac9d5678
 *         name:
 *           type: string
 *           description: The name of the pipeline.
 *           example: Sales Funnel
 *         description:
 *           type: string
 *           description: A brief description of the pipeline.
 *           example: A sales funnel for tracking client progress.
 *         stages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Stage'
 *           description: The list of stages in the pipeline.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the pipeline was created.
 *           example: 2025-01-22T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the pipeline was last updated.
 *           example: 2025-01-22T12:45:00Z
 */

const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const authenticateUser = require('../middleware/authenticateUser');
const { authorizeProduct } = require('../middleware/authorizeProduct');

router.use(authenticateUser);
router.use(authorizeProduct('projectsLite', 'projectsMax', 'crm'));
/**
 * @swagger
 * /api/pipelines/createpipeline:
 *   post:
 *     summary: Create a new ticket with optional file attachments.
 *     tags:
 *       - Pipelines
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - stages
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the pipeline.
 *                 example: Sales Funnel
 *               description:
 *                 type: string
 *                 description: Brief description of the pipeline.
 *                 example: This pipeline tracks sales progress.
 *               stages:
 *                 type: array
 *                 description: List of stages in the pipeline.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the stage.
 *                       example: Initial Contact
 *                     description:
 *                       type: string
 *                       description: Description of the stage.
 *                       example: First interaction with the client.
 *                     status:
 *                       type: string
 *                       enum: [Not Started, In Progress, Completed]
 *                       description: Status of the stage.
 *                       example: Not Started
 *                     order:
 *                       type: integer
 *                       description: Position of the stage in the pipeline.
 *                       example: 1
 *     responses:
 *       201:
 *         description: Pipeline created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pipeline'
 *       400:
 *         description: Bad Request. Missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "pipeline not found"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Error message details."
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.post('/createpipeline', pipelineController.createPipeline);
/**
 * @swagger
 * /api/pipelines/getpipeline:
 *   get:
 *     summary: Retrieve all pipelines for the authenticated user's company
 *     tags:
 *       - Pipelines
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of pipelines per page.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sorting order (e.g., -createdAt for descending by creation date).
 *     responses:
 *       200:
 *         description: List of pipelines retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pipeline'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message.
 *                   example: Internal Server Error.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getpipeline', pipelineController.getPipelines);
router.get('/getPipeline', pipelineController.getPipelines); // legacy casing
/**
 * @swagger
 * /api/pipelines/getpipeline/{id}:
 *   get:
 *     summary: Get a pipeline by its ID
 *     tags:
 *       - Pipelines
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the pipeline.
 *         example: 64d91a17c9d6d935c8e3d5a1
 *     responses:
 *       200:
 *         description: Pipeline retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pipeline'
 *       400:
 *         description: Invalid pipeline ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid pipeline ID.
 *       404:
 *         description: Pipeline not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pipeline not found.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching the pipeline.
 *                 details:
 *                   type: string
 *                   example: Cast to ObjectId failed for value "123" at path "_id" for model "Pipeline".
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getpipeline/:id', pipelineController.getPipelineById);
/**
 * @swagger
 * /api/pipelines/updatepipeline/{pipelineid}:
 *   put:
 *     summary: Update a pipeline by its ID
 *     tags:
 *       - Pipelines
 *     parameters:
 *       - in: path
 *         name: pipelineid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the pipeline to update.
 *         example: 64d91a17c9d6d935c8e3d5a1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the pipeline.
 *                 example: New Sales Funnel
 *               description:
 *                 type: string
 *                 description: A detailed description of the pipeline.
 *                 example: A sales funnel that tracks the entire sales process.
 *               stages:
 *                 type: array
 *                 description: The stages within the pipeline.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the stage.
 *                       example: Lead Qualification
 *                     description:
 *                       type: string
 *                       description: Description of the stage.
 *                       example: Qualify leads based on interest and readiness.
 *                     status:
 *                       type: string
 *                       enum: [Not Started, In Progress, Completed]
 *                       description: The current status of the stage.
 *                       example: In Progress
 *                     order:
 *                       type: integer
 *                       description: Order of the stage in the pipeline.
 *                       example: 2
 *     responses:
 *       200:
 *         description: Pipeline updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pipeline'
 *       400:
 *         description: Invalid request or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Pipeline update failed
 *                 details:
 *                   type: string
 *                   example: Cast to ObjectId failed for value "123" at path "_id"
 *       404:
 *         description: Pipeline not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pipeline not found
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while updating the pipeline.
 *                 details:
 *                   type: string
 *                   example: Error message details.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/updatepipeline/:pipelineid', pipelineController.updatePipeline);
/**
 * @swagger
 * /api/pipelines/deletepipeline/{pipelineid}:
 *   delete:
 *     summary: Delete a pipeline by its ID
 *     tags:
 *       - Pipelines
 *     parameters:
 *       - in: path
 *         name: pipelineid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the pipeline to delete.
 *         example: 64d91a17c9d6d935c8e3d5a1
 *     responses:
 *       200:
 *         description: Pipeline deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pipeline deleted successfully
 *       400:
 *         description: Invalid pipeline ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid pipeline ID
 *       404:
 *         description: Pipeline not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pipeline not found
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while deleting the pipeline.
 *                 details:
 *                   type: string
 *                   example: Error message details.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/deletepipeline/:pipelineid', pipelineController.deletePipeline);


module.exports = router;