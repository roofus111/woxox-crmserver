const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticateUser = require('../middleware/authenticateUser');
router.use(authenticateUser);
// Chat List Routes
router.get(
    '/conversations/:userId',
    messageController.getUsersWithLastMessageDetails
);

// Message History Routes
router.get(
    '/history/:userId/:withUserId',
    messageController.getMessages
);

// Single Message Routes
router.get(
    '/:messageId',
    messageController.getMessage
);

// Message Management Routes
router.put(
    '/:messageId',
    messageController.updateMessage
);

router.delete(
    '/:messageId',
    messageController.deleteMessage
);

// Message Status Routes
router.put(
    '/read/:messageId',
    messageController.markAsRead
);

// Message Reactions Routes
router.post(
    '/reaction/:messageId',
    messageController.addReaction
);

// Last Message Routes
router.get(
    '/last/conversations',
    messageController.getUsersWithLastMessageDetails
);

module.exports = router; 