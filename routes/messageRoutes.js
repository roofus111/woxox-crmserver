const express = require('express');
const multer = require('multer');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticateUser = require('../middleware/authenticateUser');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticateUser);

router.get('/contacts', messageController.getContacts);
router.get('/online-users', messageController.getOnlineUsers);
router.get('/last/conversations', messageController.getUsersWithLastMessageDetails);
router.get('/conversations', messageController.getUsersWithLastMessageDetails);

router.get('/history/:withUserId', messageController.getMessages);
router.post('/send', messageController.sendMessage);
router.post('/upload', upload.single('file'), messageController.uploadFile);
router.put('/read-conversation/:withUserId', messageController.markConversationRead);

router.put('/read/:messageId', messageController.markAsRead);
router.post('/reaction/:messageId', messageController.addReaction);

router.get('/:messageId', messageController.getMessage);
router.put('/:messageId', messageController.updateMessage);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
