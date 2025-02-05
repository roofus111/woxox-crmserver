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
 *     summary: Create a new employee
 *     description: This endpoint is used to create a new employee in the system, including file uploads (e.g., resume or profile picture).
 *     operationId: createEmployee
 *     tags:
 *       - Employee
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
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
 *               lastName:
 *                 type: string
 *                 description: Last name of the employee
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the employee
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the employee
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the employee
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Gender of the employee
 *                 example: Male
 *               address:
 *                 type: string
 *                 description: Home address of the employee
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date of the employee
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date of the employee (optional)
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, On Leave]
 *                 description: Current employment status
 *                 example: Active
 *               jobTitle:
 *                 type: string
 *                 description: Job title of the employee
 *               department:
 *                 type: string
 *                 description: Department of the employee
 *               role:
 *                 type: string
 *                 enum: [Admin, Salesperson, Manager, Support]
 *                 description: Role of the employee
 *                 example: Manager
 *               supervisor:
 *                 type: string
 *                 description: ID of the supervisor (optional)
 *                 example: "63bfc2c46f529f7b4c8eaf1b"
 *               salary:
 *                 type: number
 *                 description: Salary of the employee
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: File upload field for resume or profile picture
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
 *                 employee:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Supervisor not found (if supervisor is provided)
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
/**
 * @swagger
 * /api/hr/getemployees:
 *   get:
 *     summary: Fetch employees
 *     tags:
 *       - Employee
 *     description: Fetch a single employee by ID or a list of employees with optional filters and pagination.
 *     responses:
 *       200:
 *         description: Successfully fetched employee(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array  
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 total:
 *                   type: integer
 *                   description: Total number of employees.
 *                 page:
 *                   type: integer
 *                   description: Current page.
 *                 limit:
 *                   type: integer
 *                   description: Number of employees per page.
 *       404:
 *         description: Employee not found.
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

router.get('/getemployees', HRController.getEmployee);
/**
 * @swagger
 * /api/hr/getemployees/{EmployeeId}:
 *   get:
 *     summary: Get Employee by ID
 *     description: Fetch details of a specific employee using their unique ID.
 *     tags:
 *       - Employee
 *     parameters:
 *       - in: path
 *         name: EmployeeId
 *         required: true
 *         description: Unique identifier of the employee
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee:
 *                   type: object
 *                   description: Employee details
 *       404:
 *         description: Employee not found
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
router.get('/getemployees/:EmployeeId', HRController.getEmployee);
/**
 * @swagger
 * /api/hr/putemployees/{employeeId}:
 *   put:
 *     summary: Update an employee's details
 *     description: Update specific fields of an employee using their ID.
 *     tags:
 *       - Employee
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         description: The ID of the employee to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Fields to update for the employee
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Employee's name
 *               position:
 *                 type: string
 *                 description: Employee's position
 *               department:
 *                 type: string
 *                 description: Employee's department
 *               salary:
 *                 type: number
 *                 description: Employee's salary
 *             example:
 *               firstName: Jane Doe
 *               position: Developer
 *               department: Engineering
 *               salary: 85000
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee updated successfully
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 63a1d42fbd1f4b43f4e7345a
 *                     firstName:
 *                       type: string
 *                       example: Jane Doe
 *                     position:
 *                       type: string
 *                       example: Developer
 *                     department:
 *                       type: string
 *                       example: Engineering
 *                     salary:
 *                       type: number
 *                       example: 85000
 *       400:
 *         description: Invalid input or employee ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid employee ID
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/putemployees/:employeeId',HRController.updateEmployee);
/**
 * @swagger
 * /api/hr/employees/{employeeId}/status:
 *   put:
 *     summary: Update employee status
 *     description: Update the status of an employee (Active or Inactive).
  *    tags:
 *       - Employee
 *     parameters:
 *       - name: employeeId
 *         in: path
 *         description: The ID of the employee to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *         description: The new status of the employee
 *         required: true
  *       content:
 *         application/json:
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [Active, Inactive]
 *               description: The status to update the employee to (Active or Inactive).
 *               example: Active
 *     responses:
 *       200:
 *         description: Employee status successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee status updated to Active
 *                 employee:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid status provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid status. Must be Active or Inactive."
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Error message details
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */




router.put('/employees/:employeeId/status', HRController.updateEmployeeStatus);
router.get('/employees/status', HRController.getEmployeesByStatus);


//attachments
router.post('/:employeeId/attachments', upload.array('attachments'),HRController.postAttachment);
router.get('/employee/:employeeId/attachments/:attachmentId', HRController.getAttachmentById);
router.delete('/employee/:employeeId/attachment/:attachmentId',HRController.deleteAttachment);


//attendance
router.post('/addattendance', HRController.Addattendance)
router.get('/getallattendence', HRController.getAllAttendances);
router.get('/getattendence/:employeeId', HRController.getAttendancebyid);
router.get('/getattendenceid/:employeeId', HRController.getAttendanceByIdStatus);
router.put('/updateattendance/:employeeId/:attendanceId', HRController.updateAttendanceById);
module.exports = router;