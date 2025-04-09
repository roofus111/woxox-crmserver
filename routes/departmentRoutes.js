const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createdepartments', departmentController.createDepartment);
router.get('/getalldepartments', departmentController.getAllDepartments);
router.get('/getdepartments/:id', departmentController.getDepartmentById);
router.put('/updatedepartments/:id', departmentController.updateDepartment);
router.delete('/deletedepartments/:id', departmentController.deleteDepartment);
module.exports = router;