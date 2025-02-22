const express = require('express');
const router = express.Router();
const employeeScheduleController = require('../controller/employeeScheduleController');
const authenticateUser = require('../../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/create',employeeScheduleController.createEmployeeSchedule);
router.get('/get',employeeScheduleController.getEmployeeSchedules);
router.get('/:id',employeeScheduleController.getEmployeeScheduleById);
router.put('/:id',employeeScheduleController.updateEmployeeSchedule);
router.delete('/:id',employeeScheduleController.deleteEmployeeSchedule);

module.exports = router;
