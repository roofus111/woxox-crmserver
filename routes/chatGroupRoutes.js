const express = require('express');
const router = express.Router();
const chatGroupController = require('../controllers/chatGroupController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.get('/', chatGroupController.listGroups);
router.post('/', chatGroupController.createGroup);
router.get('/:groupId', chatGroupController.getGroup);
router.put('/:groupId', chatGroupController.updateGroup);
router.post('/:groupId/members', chatGroupController.addMembers);
router.post('/:groupId/leave', chatGroupController.leaveGroup);
router.get('/:groupId/messages', chatGroupController.getGroupMessages);
router.post('/:groupId/messages', chatGroupController.sendGroupMessage);

module.exports = router;
