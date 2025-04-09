/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       required:
 *         - company
 *         - leadId
 *         - docName
 *       properties:
 *         company:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the Company ID
 *         user:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the User ID (sales representative)
 *         leadId:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the Lead ID
 *         docName:
 *           type: string
 *           description: Name of the document
 *         fileName:
 *           type: string
 *           description: File name stored in the system
 *         fileType:
 *           type: string
 *           description: Type of the file (e.g., pdf, docx)
 *         fileUrl:
 *           type: string
 *           description: URL to access the file
 *         root:
 *           type: boolean
 *           default: false
 *           description: Indicates if the file is a root file
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the file was uploaded
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID of the file creator
 *         parent:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the parent folder
 *         access:
 *           type: string
 *           enum: [public, private, restricted]
 *           default: private
 *           description: Access level of the file
 *         shared:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               sharedWith:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID the file is shared with
 *               sharedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of when the file was shared
 *               accessLevel:
 *                 type: string
 *                 enum: [view, edit, admin]
 *                 default: view
 *                 description: Access level for the shared user
 *           description: List of shared users with their access details
 *     SharedAccess:
 *       type: object
 *       required:
 *         - userId
 *         - accessLevel
 *       properties:
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: The ID of the user to share with
 *         accessLevel:
 *           type: string
 *           enum: [read, write, admin]
 *           description: The access level for the shared user
 */


const express = require("express");
const router = express.Router();
const fileController = require("../controllers/FileHandlerController"); // Adjust path as necessary
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload and create a file
 *     description: Uploads a file to S3, stores metadata in the database, and associates it with a lead and company.
 *     tags:
 *       - File
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *                 format: ObjectId
 *                 example: 67811b31f1015aeef357c172
 *               leadId:
 *                 type: string
 *                 format: ObjectId
 *                 example: 6787a35d04ba8691d3718eca
 *                 description: The ID of the lead associated with the file.
 *               docName:
 *                 type: string
 *                 description: The document name.
 *               files:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload.
 *               parent:
 *                 type: string
 *                 format: ObjectId
 *                 example: 67ac4d4254bb790de365809e
 *                 description: The parent folder ID.
 *               access:
 *                 type: string
 *                 enum: [public, private, restricted]
 *                 description: The access level of the file.
 *               root:
 *                 type: boolean
 *                 description: Indicates if the file is at the root level.
 *                 default: false
 *     responses:
 *       201:
 *         description: File created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File created successfully
 *                 file:
 *                   $ref: '#/components/schemas/File'
 *       400:
 *         description: No files uploaded or invalid request.
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
router.post('/upload', upload.array('files'), fileController.createFile);

/**
 * @swagger
 * /api/files/getfiles/{parentId}:
 *   get:
 *     tags:
 *       - File
 *     summary: Get files and folders by parent ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files and folders
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/getfiles", fileController.getFilesAndFoldersByParentId);

/**
 * @swagger
 * /api/files/file/{fileId}:
 *   put:
 *     tags:
 *       - File
 *     summary: Update file name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: File name updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.put("/file/:fileId", fileController.updateFileName);

/**
 * @swagger
 * /api/files/copy:
 *   post:
 *     tags:
 *       - File
 *     summary: Copy a file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *               destinationParentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File copied successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/copy", fileController.copyFile);

/**
 * @swagger
 * /api/files/move:
 *   post:
 *     tags:
 *       - File
 *     summary: Move a file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *               destinationParentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File moved successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/move",fileController. moveFile);

/**
 * @swagger
 * /api/files/file/{fileId}:
 *   delete:
 *     tags:
 *       - File
 *     summary: Delete a file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.delete("/file/:fileId", fileController.deleteFile);

/**
 * @swagger
 * /api/files/files/{leadId}:
 *   get:
 *     tags:
 *       - File
 *     summary: Get files by lead ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files for the lead
 *       401:
 *         description: Unauthorized
 */
router.get("/files/:leadId", fileController.getFilesByLeadId);

/**
 * @swagger
 * /api/files/leads:
 *   get:
 *     tags:
 *       - File
 *     summary: List all leads from files and folders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all leads
 *       401:
 *         description: Unauthorized
 */
router.get("/leads", fileController.listAllLeadsFromFilesAndFolders);
router.put('/:id/tags/add', fileController.addTagsToFile); // Add tags to file
router.put('/:id/tags/remove', fileController.removeTagFromFile);
router.post("/requestupload",  fileController.requestUpload);
router.post("/upload/:requestId", upload.single('file'), fileController.uploadFile);
router.delete('/uploadcancel/:requestId', fileController.deleteRequest);

module.exports = router;



