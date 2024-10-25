const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); 
router.post('/', taskController.createTask);

// GET route for fetching all tasks
router.get('/', taskController.getAllTasks);

// PATCH route for updating a task
router.patch('/:id', taskController.updateTask);

// DELETE route for deleting a task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
