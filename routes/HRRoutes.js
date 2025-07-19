/**
 * @swagger
 * components:
 *   schemas:
 *     Attachment:
 *       type: object
 *       required:
 *         - fileName
 *         - fileUrl
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the uploaded file
 *         fileType:
 *           type: string
 *           description: Type/extension of the file
 *         fileUrl:
 *           type: string
 *           description: URL where the file is stored
 * 
 *     History:
 *       type: object
 *       required:
 *         - activityType
 *         - description
 *         - changedBy
 *       properties:
 *         activityType:
 *           type: string
 *           enum: [Employee Updated, Job Title Change, Department Change, Status Update, Attendance Added, Attendance Update, Salary Update, Leave Change, Performance Update, Training Added]
 *           description: Type of change made
 *         description:
 *           type: string
 *           description: Detailed description of the change
 *         changedBy:
 *           type: string
 *           description: Reference to User who made the change
 *         changedAt:
 *           type: string
 *           format: date-time
 *           description: When the change was made
 *         oldValue:
 *           type: string
 *           description: Previous value before change
 *         newValue:
 *           type: string
 *           description: New value after change
 * 
 *     Employee:
 *       type: object
 *       required:
 *         - company
 *         - User
 *         - firstName
 *         - email
 *       properties:
 *         company:
 *           type: string
 *           description: Reference to Company model
 *         User:
 *           type: string
 *           description: Reference to User model
 *         firstName:
 *           type: string
 *           description: Employee's first name
 *         lastName:
 *           type: string
 *           description: Employee's last name
 *         email:
 *           type: string
 *           format: email
 *           description: Employee's email address
 *         phoneNumber:
 *           type: string
 *           description: Contact number
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Gender of employee
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *           description: Employee's address details
 *         startDate:
 *           type: string
 *           format: date
 *           description: Employment start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Employment end date
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           default: Active
 *           description: Current employment status
 *         jobTitle:
 *           type: string
 *           description: Current job position
 *         department:
 *           type: string
 *           description: Department name
 *         role:
 *           type: string
 *           enum: [Admin, Salesperson, Manager, Support]
 *           description: Role in the organization
 *         supervisor:
 *           type: string
 *           description: Reference to Employee (reporting manager)
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *           description: Array of uploaded documents
 *         salary:
 *           type: number
 *           description: Current salary
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/History'
 *           description: Array of changes made to employee record
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 * 
 *     EmployeeResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           $ref: '#/components/schemas/Employee'
 *           description: Employee data
 * 
 *     EmployeeListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         count:
 *           type: number
 *           description: Total number of records
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Employee'
 *           description: Array of employee records
 */

const mongoose = require('mongoose');

// ... rest of your schema code ...
const express = require('express');
const router = express.Router();
const multer = require("multer");
const HRController = require('../controllers/HRController'); // Adjust the path as needed
const storage = multer.memoryStorage();
const upload = multer({ storage });
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)

/**
 * @swagger
 * /api/hr/create:
 *   post:
 *     summary: Create a new employee
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave]
 *               jobTitle:
 *                 type: string
 *               department:
 *                 type: string
 *               supervisor:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/create', upload.array('attachments'), HRController.createEmployee);
router.post('/linkEmployeeUser/:employeeId', HRController.linkEmployeeUser);

/**
 * @swagger
 * /api/hr/getemployees:
 *   get:
 *     summary: Get all employees
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 */
router.get('/getemployees', HRController.getEmployee);

/**
 * @swagger
 * /api/hr/getemployees/{EmployeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: EmployeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */
router.get('/getemployees/:EmployeeId', HRController.getEmployee);

/**
 * @swagger
 * /api/hr/putemployees/{employeeId}:
 *   put:
 *     summary: Update employee details
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeUpdate'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 */
router.put('/putemployees/:employeeId', HRController.updateEmployee);

/**
 * @swagger
 * /api/hr/employees/{employeeId}/status:
 *   put:
 *     summary: Update employee status
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave]
 *     responses:
 *       200:
 *         description: Employee status updated successfully
 *       404:
 *         description: Employee not found
 */
router.put('/employees/:employeeId/status', HRController.updateEmployeeStatus);

/**
 * @swagger
 * /api/hr/employees/status:
 *   get:
 *     summary: Get employees by status
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, On Leave]
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 */
router.get('/employees/status', HRController.getEmployeesByStatus);

/**
 * @swagger
 * /api/hr/{employeeId}/attachments:
 *   post:
 *     summary: Add attachments to employee
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Attachments added successfully
 */
router.post('/:employeeId/attachments', upload.array('attachments'), HRController.postAttachment);

/**
 * @swagger
 * /api/hr/employee/{employeeId}/attachments/{attachmentId}:
 *   get:
 *     summary: Get employee attachment
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment retrieved successfully
 *       404:
 *         description: Attachment not found
 */
router.get('/employee/:employeeId/attachments/:attachmentId', HRController.getAttachmentById);

/**
 * @swagger
 * /api/hr/employee/{employeeId}/attachment/{attachmentId}:
 *   delete:
 *     summary: Delete employee attachment
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       404:
 *         description: Attachment not found
 */
router.delete('/employee/:employeeId/attachment/:attachmentId', HRController.deleteAttachment);

/**
 * @swagger
 * /api/hr/renameAttachment/{employeeId}/{attachmentId}:
 *   put:
 *     summary: Rename employee attachment
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newFileName
 *             properties:
 *               newFileName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attachment renamed successfully
 *       404:
 *         description: Attachment not found
 */
router.put('/renameAttachment/:employeeId/:attachmentId', HRController.renameAttachment);
router.get('/employee/:userId', HRController.getEmployeeByUserId);

/**
 * @swagger
 * /api/hr/invitation/{token}:
 *   get:
 *     summary: Get employee details by invitation token
 *     tags: [HR]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token from email
 *     responses:
 *       200:
 *         description: Employee details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid token or expired invitation
 *       404:
 *         description: Employee not found
 */
router.get('/invitation/:token', HRController.getEmployeeByToken);

/**
 * @swagger
 * /api/hr/invitationaccept/{token}:
 *   post:
 *     summary: Accept invitation and set up user account
 *     tags: [HR]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password for the account
 *               confirmPassword:
 *                 type: string
 *                 description: Password confirmation
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid request or expired invitation
 *       404:
 *         description: Employee or user not found
 */
router.post('/invitationaccept/:token', HRController.acceptInvitation);

/**
 * @swagger
 * /api/hr/resendinvitation/{employeeId}:
 *   post:
 *     summary: Resend invitation email to employee
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Invitation email resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     invitationToken:
 *                       type: string
 *                     invitationExpiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Employee not linked to user account
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Failed to send email
 */
router.post('/resendinvitation/:employeeId', HRController.resendInvitation);

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - company
 *         - User
 *         - firstName
 *         - email
 *       properties:
 *         company:
 *           type: string
 *           description: Reference to Company
 *         User:
 *           type: string
 *           description: Reference to User
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         status:
 *           type: string
 *           enum: [Active, Inactive, On Leave]
 *         jobTitle:
 *           type: string
 *         department:
 *           type: string
 *         supervisor:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *
 *     EmployeeUpdate:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         jobTitle:
 *           type: string
 *         department:
 *           type: string
 *         supervisor:
 *           type: string
 *
 *     Attachment:
 *       type: object
 *       required:
 *         - fileName
 *         - fileUrl
 *       properties:
 *         fileName:
 *           type: string
 *         fileType:
 *           type: string
 *         fileUrl:
 *           type: string
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;