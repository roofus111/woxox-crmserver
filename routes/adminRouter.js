const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);

router.post('adminadded', adminController.createAdmin);

module.exports = router;