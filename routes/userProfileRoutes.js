const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser); // Apply authentication to all routes
router.get('/', userProfileController.getAllProfiles);
router.post('/', userProfileController.createProfile);

module.exports = router;
