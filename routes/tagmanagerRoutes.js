const express = require('express');
const router = express.Router();
const tagManagerController = require('../controllers/tagmanagerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTag', tagManagerController.addTag);
router.get("/multiple", tagManagerController.getMultipleTags);
router.put("/update-name", tagManagerController.updateTagById);
router.put("/update-items", tagManagerController.updateTaggedItemsById);
router.delete("/delete/:tagId", tagManagerController.deleteTagById);



module.exports = router;