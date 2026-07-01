const express = require('express');
const router = express.Router();
const authenticateUser = require('../../../middleware/authenticateUser');
const whatsappController = require('../controllers/whatsappController');
const { requireWhatsAppPermission } = require('../middleware/permissions');
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many webhook requests' },
});

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: WhatsApp Business Cloud API integration
 */

// Public webhook routes (no auth)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', webhookLimiter, whatsappController.handleWebhook);

router.use(authenticateUser);

/**
 * @swagger
 * /api/whatsapp/settings:
 *   get:
 *     summary: Get WhatsApp settings
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 */
router.get('/settings', requireWhatsAppPermission('settings'), whatsappController.getSettings);
router.put('/settings', requireWhatsAppPermission('settings'), whatsappController.updateSettings);
router.post('/settings/test', requireWhatsAppPermission('settings'), whatsappController.testConnection);

// Conversations & Messages
router.get('/conversations', requireWhatsAppPermission('view_chats'), whatsappController.listConversations);
router.get('/conversations/:id', requireWhatsAppPermission('view_chats'), whatsappController.getConversation);
router.get('/conversations/:id/messages', requireWhatsAppPermission('view_chats'), whatsappController.getMessages);
router.post('/conversations/:id/messages', requireWhatsAppPermission('reply'), whatsappController.sendMessage);
router.post('/conversations/:id/read', requireWhatsAppPermission('view_chats'), whatsappController.markRead);
router.post('/conversations/:id/assign', requireWhatsAppPermission('assignments'), whatsappController.assignConversation);
router.patch('/conversations/:id/status', requireWhatsAppPermission('reply'), whatsappController.updateConversationStatus);
router.patch('/conversations/:id/pin', requireWhatsAppPermission('view_chats'), whatsappController.togglePin);
router.get('/conversations/:id/profile', requireWhatsAppPermission('view_chats'), whatsappController.getContactProfile);
router.get('/conversations/:id/notes', requireWhatsAppPermission('view_chats'), whatsappController.listNotes);
router.post('/conversations/:id/notes', requireWhatsAppPermission('reply'), whatsappController.addNote);

// Quick Replies
router.get('/quick-replies', requireWhatsAppPermission('reply'), whatsappController.listQuickReplies);
router.post('/quick-replies', requireWhatsAppPermission('reply'), whatsappController.createQuickReply);
router.post('/quick-replies/:id/render', requireWhatsAppPermission('reply'), whatsappController.renderQuickReply);

// Templates
router.get('/templates', requireWhatsAppPermission('templates'), whatsappController.listTemplates);
router.post('/templates', requireWhatsAppPermission('templates'), whatsappController.createTemplate);
router.post('/templates/sync', requireWhatsAppPermission('templates'), whatsappController.syncTemplates);

// Broadcasts & Campaigns
router.get('/broadcasts', requireWhatsAppPermission('broadcast'), whatsappController.listBroadcasts);
router.post('/broadcasts', requireWhatsAppPermission('broadcast'), whatsappController.createBroadcast);
router.post('/broadcasts/preview', requireWhatsAppPermission('broadcast'), whatsappController.previewBroadcastRecipients);
router.get('/campaigns', requireWhatsAppPermission('campaigns'), whatsappController.listCampaigns);
router.post('/campaigns', requireWhatsAppPermission('campaigns'), whatsappController.createCampaign);

// Reports & Timeline
router.get('/reports', requireWhatsAppPermission('reports'), whatsappController.getReports);
router.get('/timeline/:leadId', requireWhatsAppPermission('view_chats'), whatsappController.getLeadTimeline);

// Media, Automation, Chatbot, Scheduler
router.get('/media', requireWhatsAppPermission('view_chats'), whatsappController.listMedia);
router.get('/automations', requireWhatsAppPermission('settings'), whatsappController.listAutomations);
router.post('/automations', requireWhatsAppPermission('settings'), whatsappController.createAutomation);
router.get('/chatbot-flows', requireWhatsAppPermission('settings'), whatsappController.listChatbotFlows);
router.post('/chatbot-flows', requireWhatsAppPermission('settings'), whatsappController.createChatbotFlow);
router.get('/scheduled', requireWhatsAppPermission('reply'), whatsappController.listScheduled);
router.post('/scheduled', requireWhatsAppPermission('reply'), whatsappController.createScheduled);
router.get('/logs', requireWhatsAppPermission('settings'), whatsappController.getMessageLogs);

module.exports = router;
