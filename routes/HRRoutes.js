/**
 * @swagger
 * components:
 *   schemas:
 *     Attachment:
 *       type: object
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the file.
 *         fileType:
 *           type: string
 *           description: Type of the file (e.g., pdf, jpg).
 *         fileUrl:
 *           type: string
 *           description: URL where the file is stored.
 *       required:
 *         - fileName
 *         - fileUrl
 *
 *     Leave:
 *       type: object
 *       properties:
 *         employee:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the employee who requested the leave.
 *         leaveType:
 *           type: string
 *           enum: ['Sick', 'Casual', 'Maternity', 'Other']
 *           description: Type of leave.
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the leave.
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of the leave.
 *         status:
 *           type: string
 *           enum: ['Pending', 'Approved', 'Rejected']
 *           description: Current status of the leave request.
 *         reason:
 *           type: string
 *           description: Reason for the leave.
 *
 *     Attendance:
 *       type: object
 *       properties:
 *         employee:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the employee.
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the attendance record.
 *         checkInTime:
 *           type: string
 *           format: date-time
 *           description: Check-in time.
 *         checkOutTime:
 *           type: string
 *           format: date-time
 *           description: Check-out time.
 *         status:
 *           type: string
 *           enum: ['Present', 'Absent', 'On Leave']
 *           description: Attendance status for the day.
 *
 *     Payroll:
 *       type: object
 *       properties:
 *         employee:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the employee.
 *         basicSalary:
 *           type: number
 *           description: Base salary amount.
 *         bonus:
 *           type: number
 *           description: Bonus amount.
 *         deductions:
 *           type: number
 *           description: Deductions amount.
 *         netSalary:
 *           type: number
 *           description: Net salary after deductions and bonuses.
 *         paymentDate:
 *           type: string
 *           format: date
 *           description: Date of salary payment.
 *
 *     Employee:
 *       type: object
 *       properties:
 *         company:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the company the employee works for.
 *         User:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the User model for sales representatives.
 *         firstName:
 *           type: string
 *           description: First name of the employee.
 *         lastName:
 *           type: string
 *           description: Last name of the employee.
 *         email:
 *           type: string
 *           format: email
 *           description: Employee's email address.
 *         phoneNumber:
 *           type: string
 *           description: Employee's phone number.
 *         gender:
 *           type: string
 *           enum: ['Male', 'Female', 'Other']
 *           description: Gender of the employee.
 *         status:
 *           type: string
 *           enum: ['Active', 'Inactive', 'On Leave']
 *           description: Current employment status.
 *         jobTitle:
 *           type: string
 *           description: Job title of the employee.
 *         department:
 *           type: string
 *           description: Department of the employee.
 *         supervisor:
 *           type: string
 *           format: ObjectId
 *           description: Reference to the supervisor (another Employee).
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *         attendence:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attendance'
 *         payroll:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Payroll'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the employee record was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the employee record was last updated.
 *       required:
 *         - company
 *         - User
 *         - firstName
 *         - email
 */

const express = require('express');
const router = express.Router();
const multer = require("multer");
const HRController = require('../controllers/HRController'); // Adjust the path as needed
const storage = multer.memoryStorage();
const upload = multer({ storage });
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser)
// employee
/**
 * @swagger
 * /api/hr/create:
 *   post:
 *     summary: Create a new employee with optional file uploads
 *     tags:
 *       - Employees
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the employee
 *                 example: John
 *               lastName:
 *                 type: string
 *                 description: Last name of the employee
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the employee
 *                 example: john.doe@example.com
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the employee
 *                 example: +1234567890
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the employee
 *                 example: 1990-01-01
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Gender of the employee
 *                 example: Male
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     description: Street address
 *                     example: 123 Main St
 *                   city:
 *                     type: string
 *                     description: City
 *                     example: New York
 *                   state:
 *                     type: string
 *                     description: State
 *                     example: NY
 *                   zipCode:
 *                     type: string
 *                     description: ZIP Code
 *                     example: 10001
 *                   country:
 *                     type: string
 *                     description: Country
 *                     example: USA
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Employment start date
 *                 example: 2023-01-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Employment end date
 *                 example: 2025-01-01
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave]
 *                 description: Current employment status
 *                 example: Active
 *               jobTitle:
 *                 type: string
 *                 description: Job title of the employee
 *                 example: Software Engineer
 *               department:
 *                 type: string
 *                 description: Department the employee belongs to
 *                 example: IT
 *               role:
 *                 type: string
 *                 enum: [Admin, Salesperson, Manager, Support]
 *                 description: Role of the employee
 *                 example: Manager
 *               salary:
 *                 type: number
 *                 description: Salary of the employee
 *                 example: 50000
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of files to upload
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee created successfully
 *                 employee:
 *                   type: object
 *                   description: Newly created employee details
 *       400:
 *         description: Bad request (validation error)
 *       404:
 *         description: Supervisor not found
 *       500:
 *         description: Internal server error
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.post('/create', upload.array('attachments'),HRController.createEmployee);
router.get('/getemployees', HRController.getEmployee);
router.get('/getemployees/:EmployeeId', HRController.getEmployee);
router.put('/putemployees/:employeeId',HRController.updateEmployee);
router.put('/employees/:employeeId/status', HRController.updateEmployeeStatus);
router.get('/employees/status', HRController.getEmployeesByStatus);


//attachments
router.post('/:employeeId/attachments', upload.array('attachments'),HRController.postAttachment);
router.get('/employee/:employeeId/attachments/:attachmentId', HRController.getAttachmentById);
router.delete('/employee/:employeeId/attachment/:attachmentId',HRController.deleteAttachment);


//attendance
router.post('/addattendance', HRController.addAttendance)
router.get('/getattendence/:employeeId', HRController.getAttendancebyid);

module.exports = router;