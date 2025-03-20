const express = require('express');
const router = express.Router();
const tagManagerController = require('../controllers/tagmanagerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTag', tagManagerController.createTag);



module.exports = router;