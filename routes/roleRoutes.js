const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createrole', roleController.createRole);
module.exports = router;