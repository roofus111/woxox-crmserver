
/**
 * @swagger
 * components:
 *   schemas:
 *     Shared:
 *       type: object
 *       properties:
 *         sharedWith:
 *           type: string
 *           format: ObjectId
 *           description: ID of the user the file is shared with.
 *         sharedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the file was shared.
 *         accessLevel:
 *           type: string
 *           enum: [view, edit, admin]
 *           default: view
 *           description: Access level granted to the shared user.
 *
 *     Folder:
 *       type: object
 *       required:
 *         - company
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique identifier for the folder.
 *         company:
 *           type: string
 *           format: ObjectId
 *           description: ID of the associated company.
 *         user:
 *           type: string
 *           format: ObjectId
 *           description: ID of the user who owns/created the folder.
 *         folderName:
 *           type: string
 *           description: Name of the folder.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the folder was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the folder was last updated.
 *         parent:
 *           type: string
 *           format: ObjectId
 *           nullable: true
 *           description: ID of the parent folder, if applicable.
 *         root:
 *           type: boolean
 *           default: false
 *           description: Whether the folder is a root folder.
 *         access:
 *           type: string
 *           enum: [public, private, restricted]
 *           default: private
 *           description: Access level of the folder.
 *         shared:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Shared'
 *           description: List of users the folder is shared with.
 */
const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController"); // Adjust path as necessary
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)
/**
 * @swagger
 * /api/folders/postfolder:
 *   post:
 *     summary: Create a new folder
 *     description: Creates a new folder under the specified parent folder or as a root folder.
 *     tags:
 *       - Folders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folderName
 *             properties:
 *               folderName:
 *                 type: string
 *                 description: Name of the new folder.
 *               parent:
 *                 type: string
 *                 format: ObjectId
 *                 nullable: true
 *                 description: ID of the parent folder (if any).
 *               access:
 *                 type: string
 *                 enum: [public, private, restricted]
 *                 default: private
 *                 description: Access level of the folder.
 *               shared:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sharedWith:
 *                       type: string
 *                       format: ObjectId
 *                       description: ID of the user the folder is shared with.
 *                     accessLevel:
 *                       type: string
 *                       enum: [view, edit, admin]
 *                       description: Access level for the shared user.
 *     responses:
 *       201:
 *         description: Folder created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 folder:
 *                   $ref: '#/components/schemas/Folder'
 *       400:
 *         description: Invalid input data (e.g., missing folder name, invalid parent ID).
 *       403:
 *         description: Unauthorized - User must belong to a company.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.post('/postfolder', folderController.createFolder);
// Route for getting all folders
/**
 * @swagger
 * /api/folders/getfolders:
 *   get:
 *     summary: Get all folders for the user's company
 *     description: Retrieves all folders associated with the logged-in user's company.
 *     tags:
 *       - Folders
 *     responses:
 *       200:
 *         description: List of folders retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Folder'
 *       403:
 *         description: Unauthorized - User must belong to a company.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.get("/getfolders", folderController.getAllFolders);
/**
 * @swagger
 * /api/folders/{id}:
 *   get:
 *     summary: Get a folder by ID
 *     description: Retrieves details of a specific folder by its ID, ensuring it belongs to the user's company.
 *     tags:
 *       - Folders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the folder to retrieve.
 *     responses:
 *       200:
 *         description: Folder details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 *       400:
 *         description: Invalid folder ID.
 *       403:
 *         description: Unauthorized - User must belong to a company.
 *       404:
 *         description: Folder not found or access denied.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.get("/:id", folderController.getFolderById);
/**
 * @swagger
 * /api/folders/{id}:
 *   put:
 *     summary: Update a folder by ID
 *     description: Updates the details of a specific folder by its ID, ensuring it belongs to the user's company.
 *     tags:
 *       - Folders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the folder to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderName:
 *                 type: string
 *                 description: The new name of the folder.
 *               parent:
 *                 type: string
 *                 format: ObjectId
 *                 description: The parent folder ID (if updating).
 *               access:
 *                 type: string
 *                 enum: [public, private, restricted]
 *                 description: The access level of the folder.
 *               shared:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sharedWith:
 *                       type: string
 *                       format: ObjectId
 *                       description: The ID of the user the folder is shared with.
 *                     accessLevel:
 *                       type: string
 *                       enum: [view, edit, admin]
 *                       description: The access level for the shared user.
 *     responses:
 *       200:
 *         description: Folder updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Folder updated successfully
 *                 folder:
 *                   $ref: '#/components/schemas/Folder'
 *       400:
 *         description: Invalid folder ID or request body.
 *       403:
 *         description: Unauthorized - User must belong to a company.
 *       404:
 *         description: Folder not found or access denied.
 *       500:
 *         description: Internal server error.
 */
router.put("/:id", folderController.updateFolder);
// Route for deleting a folder by ID
/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     summary: Delete a folder by ID
 *     description: Deletes a specific folder by its ID, ensuring it belongs to the user's company.
 *     tags:
 *       - Folders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: The ID of the folder to delete.
 *     responses:
 *       200:
 *         description: Folder deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Folder deleted successfully
 *       400:
 *         description: Invalid folder ID.
 *       403:
 *         description: Unauthorized - User must belong to a company.
 *       404:
 *         description: Folder not found or access denied.
 *       500:
 *         description: Internal server error.
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.delete("/:id", folderController.deleteFolder);

module.exports = router;