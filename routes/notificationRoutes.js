const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateUser = require("../middleware/authenticateUser");
router.use(authenticateUser); 

router.post('/create', notificationController.createNotification);
router.get('/getall', notificationController.getNotifications);
router.put('/mark-all-read', notificationController.markAllNotificationsRead);
router.put('/update/:id', notificationController.updateNotificationStatus);
router.delete('/delete/:id', notificationController.deleteNotification);
module.exports = router;
