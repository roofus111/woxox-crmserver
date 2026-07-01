const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authenticateUser = require('../../../middleware/authenticateUser');
const emailController = require('../controllers/emailController');
const { requireEmailPermission } = require('../middleware/permissions');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many tracking requests' },
});

/**
 * @swagger
 * tags:
 *   name: Email Marketing
 *   description: Enterprise email marketing module
 */

// Public tracking & OAuth callback routes
router.get('/track/open/:trackingId', trackingLimiter, emailController.trackOpen);
router.get('/track/click/:trackingId/:linkId', trackingLimiter, emailController.trackClick);
router.get('/unsubscribe/:trackingId', emailController.unsubscribe);
router.get('/oauth/google/callback', emailController.googleOAuthCallback);
router.get('/oauth/microsoft/callback', emailController.microsoftOAuthCallback);

router.use(authenticateUser);

// Dashboard
router.get('/dashboard', requireEmailPermission('view'), emailController.getDashboard);

// Templates
router.get('/templates', requireEmailPermission('view'), emailController.listTemplates);
router.post('/templates', requireEmailPermission('create'), emailController.createTemplate);
router.post('/templates/seed', requireEmailPermission('create'), emailController.seedTemplates);
router.get('/templates/:id', requireEmailPermission('view'), emailController.getTemplate);
router.put('/templates/:id', requireEmailPermission('edit'), emailController.updateTemplate);
router.post('/templates/:id/duplicate', requireEmailPermission('create'), emailController.duplicateTemplate);
router.delete('/templates/:id', requireEmailPermission('delete'), emailController.deleteTemplate);
router.get('/templates/:id/export-mjml', requireEmailPermission('view'), emailController.exportTemplateMjml);

// Campaigns
router.get('/campaigns', requireEmailPermission('view'), emailController.listCampaigns);
router.post('/campaigns', requireEmailPermission('create'), emailController.createCampaign);
router.get('/campaigns/:id', requireEmailPermission('view'), emailController.getCampaign);
router.post('/campaigns/:id/launch', requireEmailPermission('publish'), emailController.launchCampaign);
router.put('/campaigns/:id', requireEmailPermission('edit'), emailController.updateCampaign);
router.delete('/campaigns/:id', requireEmailPermission('delete'), emailController.deleteCampaign);
router.patch('/campaigns/:id/status', requireEmailPermission('edit'), emailController.updateCampaignStatus);
router.get('/campaigns/:id/analytics', requireEmailPermission('analytics'), emailController.getCampaignAnalytics);
router.get('/campaigns/:id/heatmap', requireEmailPermission('analytics'), emailController.getCampaignHeatmap);
router.post('/campaigns/:id/ab-test/evaluate', requireEmailPermission('publish'), emailController.evaluateAbWinner);

// Emails / Inbox
router.get('/emails', requireEmailPermission('view'), emailController.listEmails);
router.post('/emails/send', requireEmailPermission('create'), emailController.sendEmail);
router.post('/emails/test', requireEmailPermission('create'), emailController.sendTestEmail);
router.post('/emails/check', requireEmailPermission('create'), emailController.runEmailTests);
router.get('/emails/:emailId/heatmap', requireEmailPermission('analytics'), emailController.getEmailHeatmap);
router.get('/emails/:id', requireEmailPermission('view'), emailController.getEmail);
router.patch('/emails/:id', requireEmailPermission('edit'), emailController.updateEmailFlags);
router.delete('/emails/:id', requireEmailPermission('delete'), emailController.deleteEmail);
router.get('/drafts', requireEmailPermission('view'), emailController.listDrafts);
router.post('/drafts', requireEmailPermission('create'), emailController.saveDraft);
router.get('/drafts/:id', requireEmailPermission('view'), emailController.getDraft);
router.delete('/drafts/:id', requireEmailPermission('delete'), emailController.deleteDraft);
router.get('/timeline/:leadId', requireEmailPermission('view'), emailController.getLeadTimeline);

// Analytics
router.get('/analytics', requireEmailPermission('analytics'), emailController.getAnalytics);

// SMTP
router.get('/smtp', requireEmailPermission('smtp'), emailController.listSmtpAccounts);
router.post('/smtp', requireEmailPermission('smtp'), emailController.createSmtpAccount);
router.put('/smtp/:id', requireEmailPermission('smtp'), emailController.updateSmtpAccount);
router.delete('/smtp/:id', requireEmailPermission('smtp'), emailController.deleteSmtpAccount);
router.post('/smtp/:id/test', requireEmailPermission('smtp'), emailController.testSmtpAccount);
router.get('/oauth/urls', requireEmailPermission('smtp'), emailController.getOAuthUrls);
router.get('/imap/status', requireEmailPermission('view'), emailController.getImapSyncStatus);
router.post('/imap/sync/:accountId', requireEmailPermission('edit'), emailController.syncImap);
router.post('/imap/sync', requireEmailPermission('edit'), emailController.syncImap);
router.put('/imap/:accountId', requireEmailPermission('smtp'), emailController.configureImap);

// Domains
router.get('/domains', requireEmailPermission('smtp'), emailController.listDomains);
router.post('/domains', requireEmailPermission('smtp'), emailController.addDomain);
router.post('/domains/:id/verify', requireEmailPermission('smtp'), emailController.verifyDomain);
router.delete('/domains/:id', requireEmailPermission('smtp'), emailController.deleteDomain);

// Lists
router.get('/lists', requireEmailPermission('view'), emailController.listContactLists);
router.post('/lists', requireEmailPermission('create'), emailController.createContactList);
router.get('/lists/:id', requireEmailPermission('view'), emailController.getContactList);
router.put('/lists/:id', requireEmailPermission('edit'), emailController.updateContactList);
router.delete('/lists/:id', requireEmailPermission('delete'), emailController.deleteContactList);
router.post('/lists/:id/import-leads', requireEmailPermission('edit'), emailController.importLeadsToList);

// Segments
router.get('/segments', requireEmailPermission('view'), emailController.listSegments);
router.post('/segments', requireEmailPermission('create'), emailController.createSegment);
router.get('/segments/:id', requireEmailPermission('view'), emailController.getSegment);
router.put('/segments/:id', requireEmailPermission('edit'), emailController.updateSegment);
router.delete('/segments/:id', requireEmailPermission('delete'), emailController.deleteSegment);
router.post('/segments/preview', requireEmailPermission('view'), emailController.previewSegment);

// Automation
router.get('/automations', requireEmailPermission('view'), emailController.listAutomations);
router.post('/automations', requireEmailPermission('create'), emailController.createAutomation);
router.get('/automations/:id', requireEmailPermission('view'), emailController.getAutomation);
router.put('/automations/:id', requireEmailPermission('edit'), emailController.updateAutomation);
router.patch('/automations/:id/status', requireEmailPermission('edit'), emailController.updateAutomationStatus);
router.delete('/automations/:id', requireEmailPermission('delete'), emailController.deleteAutomation);

// Suppression
router.get('/suppression', requireEmailPermission('view'), emailController.listSuppression);
router.post('/suppression', requireEmailPermission('edit'), emailController.addSuppression);
router.delete('/suppression/:id', requireEmailPermission('edit'), emailController.deleteSuppression);

// Settings & Logs & Webhooks
router.get('/settings', requireEmailPermission('settings'), emailController.getSettings);
router.put('/settings', requireEmailPermission('settings'), emailController.updateSettings);
router.get('/logs', requireEmailPermission('settings'), emailController.getLogs);
router.get('/webhooks', requireEmailPermission('settings'), emailController.listWebhooks);
router.post('/webhooks', requireEmailPermission('settings'), emailController.createWebhook);
router.put('/webhooks/:id', requireEmailPermission('settings'), emailController.updateWebhook);
router.delete('/webhooks/:id', requireEmailPermission('settings'), emailController.deleteWebhook);

// Attachments
router.post('/attachments', requireEmailPermission('create'), upload.single('file'), emailController.uploadAttachment);
router.get('/attachments/:id', requireEmailPermission('view'), emailController.getAttachment);

module.exports = router;
