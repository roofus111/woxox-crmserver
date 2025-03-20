const express = require('express');
const router = express.Router();
const tagManagerController = require('../controllers/tagmanagerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTag', tagManagerController.createTag);
router.get("/alltags", tagManagerController.getTags);
router.get("/tag/:name", tagManagerController.getTagByName);
router.put("/updatetags/:name", tagManagerController.updateTag);
router.delete("/deletetags/:name", tagManagerController.deleteTag);

module.exports = router;