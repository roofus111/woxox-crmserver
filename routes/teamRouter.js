const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTeam', teamController.createTeam);
module.exports = router;