/**
 * @swagger
 * components:
 *   schemas:
 *     ShiftDetails:
 *       type: object
 *       properties:
 *         shiftType:
 *           type: string
 *           enum: [Morning, Afternoon, Night, Flexible]
 *           description: Type of work shift
 *         shiftStartTime:
 *           type: string
 *           description: Start time of the shift
 *         shiftEndTime:
 *           type: string
 *           description: End time of the shift
 * 
 *     LeaveDetails:
 *       type: object
 *       properties:
 *         leaveType:
 *           type: string
 *           enum: [Sick Leave, Casual Leave, Annual Leave, Unpaid Leave, Maternity Leave, Paternity Leave, Emergency Leave, Study Leave, Unauthorized Leave, Uninformed Leave]
 *           description: Type of leave taken
 *         leaveReason:
 *           type: string
 *           description: Reason for taking leave
 *         leaveStartDate:
 *           type: string
 *           format: date
 *           description: Start date of leave period
 *         leaveEndDate:
 *           type: string
 *           format: date
 *           description: End date of leave period
 *         leaveApprovalStatus:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *           description: Status of leave approval
 *         approvedBy:
 *           type: string
 *           description: Reference to User who approved the leave
 *         headOfDepartmentApproval:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *           description: HOD approval status
 *         headOfDepartment:
 *           type: string
 *           description: Reference to User (HOD)
 * 
 *     ODDetails:
 *       type: object
 *       properties:
 *         odReason:
 *           type: string
 *           description: Reason for on-duty
 *         odLocation:
 *           type: string
 *           description: Location of on-duty work
 *         odApprovalStatus:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *           description: Status of OD approval
 *         approvedBy:
 *           type: string
 *           description: Reference to User who approved OD
 * 
 *     Attendance:
 *       type: object
 *       required:
 *         - company
 *         - User
 *         - employeeId
 *         - date
 *         - status
 *       properties:
 *         company:
 *           type: string
 *           description: Reference to Company model
 *         User:
 *           type: string
 *           description: Reference to User model
 *         employeeId:
 *           type: string
 *           description: Reference to Employee model
 *         date:
 *           type: string
 *           format: date
 *           description: Date of attendance
 *         status:
 *           type: string
 *           enum: [Present, Absent, Late, Leave, Remote, OD, Half Day, LOP, WFH]
 *           description: Attendance status
 *         checkInTime:
 *           type: string
 *           format: date-time
 *           description: Time of check-in
 *         checkOutTime:
 *           type: string
 *           format: date-time
 *           description: Time of check-out
 *         workHours:
 *           type: number
 *           description: Total hours worked
 *         overtimeHours:
 *           type: number
 *           description: Overtime hours
 *         breakTime:
 *           type: number
 *           description: Break time in minutes
 *         shiftDetails:
 *           $ref: '#/components/schemas/ShiftDetails'
 *           description: Details of work shift
 *         leaveDetails:
 *           $ref: '#/components/schemas/LeaveDetails'
 *           description: Details if on leave
 *         odDetails:
 *           $ref: '#/components/schemas/ODDetails'
 *           description: Details if on-duty
 *         notes:
 *           type: string
 *           description: Additional notes or comments
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 * 
 *     AttendanceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           $ref: '#/components/schemas/Attendance'
 *           description: Attendance data
 * 
 *     AttendanceListResponse:
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
 *             $ref: '#/components/schemas/Attendance'
 *           description: Array of attendance records
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController')
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

/**
 * @swagger
 * /api/attendance/createattendence:
 *   post:
 *     tags:
 *       - Attendance
 *     summary: Create new attendance record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - date
 *               - status
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: ID of the employee
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of attendance
 *               status:
 *                 type: string
 *                 enum: [present, absent, half-day, leave]
 *                 description: Attendance status
 *     responses:
 *       201:
 *         description: Attendance created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/createattendence",attendanceController.createAttendance);

/**
 * @swagger
 * /api/attendance/getattendance:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Get attendance by date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of range
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date of range
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 */
router.get("/getattendance",attendanceController.getAttendanceByDateRange);

/**
 * @swagger
 * /api/attendance/employee/{employeeId}:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Get attendance by employee ID and date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Employee attendance records retrieved successfully
 *       404:
 *         description: Employee not found
 */
router.get("/employee/:employeeId",attendanceController.getAttendanceByEmployeeIdAndDateRange);

/**
 * @swagger
 * /api/attendance/insight/{employeeId}:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Get attendance insights for an employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance insights retrieved successfully
 *       404:
 *         description: Employee not found
 */
router.get("/insight/:employeeId",attendanceController.getAttendanceInsightsByEmployeeId);

/**
 * @swagger
 * /api/attendance/leaves/{employeeId}:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Get leave types for an employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave types retrieved successfully
 *       404:
 *         description: Employee not found
 */
router.get("/leaves/:employeeId", attendanceController.getLeaveTypesByEmployee);

/**
 * @swagger
 * /api/attendance/{id}:
 *   put:
 *     tags:
 *       - Attendance
 *     summary: Update attendance record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [present, absent, half-day, leave]
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *       404:
 *         description: Attendance record not found
 */
router.put('/:id', attendanceController.updateAttendance);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     tags:
 *       - Attendance
 *     summary: Delete attendance record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance deleted successfully
 *       404:
 *         description: Attendance record not found
 */
router.delete('/:id',attendanceController.deleteAttendance);

/**
 * @swagger
 * /api/attendance/my-attendance:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Get current user's attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User attendance retrieved successfully
 */
router.get('/my-attendance', attendanceController.getMyAttendance);

router.post('/apply-leave', attendanceController.applyForLeave);

router.put('/approve-leave/:id', attendanceController.approveOrRejectLeave);

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - employeeId
 *         - date
 *         - status
 *       properties:
 *         employeeId:
 *           type: string
 *           description: Reference to Employee model
 *         date:
 *           type: string
 *           format: date
 *           description: Date of attendance
 *         status:
 *           type: string
 *           enum: [present, absent, half-day, leave]
 *           description: Attendance status
 *         checkIn:
 *           type: string
 *           format: date-time
 *           description: Check-in time
 *         checkOut:
 *           type: string
 *           format: date-time
 *           description: Check-out time
 *         leaveType:
 *           type: string
 *           enum: [sick, casual, annual, unpaid]
 *           description: Type of leave if status is leave
 *         notes:
 *           type: string
 *           description: Additional notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;
