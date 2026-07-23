const express = require('express');
const authenticateUser = require('../../../middleware/authenticateUser');
const controller = require('../controllers/personalWhatsappController');

const router = express.Router();
router.use(authenticateUser);

router.get('/status', controller.getStatus);
router.post('/connect', controller.connect);
router.post('/disconnect', controller.disconnect);
router.post('/send', controller.sendMessage);

module.exports = router;
