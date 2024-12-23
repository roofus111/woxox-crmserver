const express = require('express');
const router = express.Router();
const Task = require('../controllers/taskController');
const Stage = require('../controllers/stageController');

// Create a new follow-up


const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); // Apply authentication to all routes


router.post('/stage', Stage.createStage);
router.post('/task', Task.createTask);

module.exports = router;
