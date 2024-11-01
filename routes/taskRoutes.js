const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); 
router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
