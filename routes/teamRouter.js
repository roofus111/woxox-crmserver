const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTeam', teamController.createTeam);
router.get('/getallteams', teamController.getTeams);
router.get('/getteams/:id', teamController.getTeamById);
router.put('/updateteams/:id', teamController.updateTeam);
router.delete('/deleteteams/:id', teamController.deleteTeam);
module.exports = router;