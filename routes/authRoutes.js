const express = require('express');
const { register, login, changePassword } = require('../controllers/authController');
const authenticateUser = require('../middleware/authenticateUser');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Apply authenticateUser middleware directly to the change-password route
router.post('/change-password', authenticateUser, changePassword);

module.exports = router;
