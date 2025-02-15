const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController')
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

router.post("/createattendence",attendanceController.createAttendance);
router.get("/getattendance",attendanceController.getAttendanceByDateRange);
router.get("/employee/:employeeId",attendanceController. getAttendanceByEmployeeIdAndDateRange);
router.get("/insight/:employeeId",attendanceController. getAttendanceInsightsByEmployeeId);
router.get("/leaves/:employeeId", attendanceController. getLeaveTypesByEmployee);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id',attendanceController. deleteAttendance);
module.exports = router;
