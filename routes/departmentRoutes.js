const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createdepartments', departmentController.createDepartment);
module.exports = router;