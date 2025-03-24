const express = require('express');
const router = express.Router();
const tagManagerController = require('../controllers/tagmanagerController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createTag', tagManagerController.createTag);
router.get("/alltags", tagManagerController.getTags);
router.get("/tag/:name", tagManagerController.getTagByName);
router.put("/updatetags/:id", tagManagerController.updateTag);
router.delete("/deletetags/:id", tagManagerController.deleteTag);
router.post('/common-leads', tagManagerController.getCommonLeadsInTags);
router.get('/tags-with-counts', tagManagerController.getAllTagsWithCounts);
router.get('/leads-by-tags', tagManagerController.getLeadsByTags);

module.exports = router;