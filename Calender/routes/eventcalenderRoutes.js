const express = require('express');
const router = express.Router();
const eventController = require('../controller/eventCalenderController');
const authenticateUser = require('../../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/create',eventController.createEvent);
router.get('/get',eventController.getAllEvents);
router.get('/:id',eventController.getEventById);
router.put('/:id',eventController.updateEvent);
router.delete('/:id',eventController.deleteEvent);

module.exports = router;
