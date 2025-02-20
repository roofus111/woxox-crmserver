const express = require('express');
const router = express.Router();
const taskController = require('../controller/taskCalenderController');
const authenticateUser = require('../../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/create',taskController.createTask);
router.get('/get',taskController.getAllTasks);
router.get('/:id',taskController.getTaskById);
router.put('/:id',taskController.updateTask);
router.delete('/:id',taskController.deleteTask);

module.exports = router;
