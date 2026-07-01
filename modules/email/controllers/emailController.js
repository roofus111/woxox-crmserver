const { success, error, paginated } = require('../utils/apiResponse');
const DashboardService = require('../services/DashboardService');
const TemplateService = require('../services/TemplateService');
const CampaignService = require('../services/CampaignService');
const EmailService = require('../services/EmailService');
const SmtpService = require('../services/SmtpService');
const TrackingService = require('../services/TrackingService');
const ListService = require('../services/ListService');
const SegmentService = require('../services/SegmentService');
const AutomationService = require('../services/AutomationService');
const DomainService = require('../services/DomainService');
const AttachmentService = require('../services/AttachmentService');
const ImapSyncService = require('../services/ImapSyncService');
const OAuthService = require('../services/OAuthService');
const EmailTestService = require('../services/EmailTestService');
const AbTestService = require('../services/AbTestService');
const HeatmapService = require('../services/HeatmapService');
const EmailSMTPAccount = require('../models/SMTPAccount');
const SettingsService = require('../services/SettingsService');
const EmailLog = require('../models/EmailLog');
const EmailSuppressionList = require('../models/SuppressionList');
const EmailWebhook = require('../models/EmailWebhook');
const EmailTemplate = require('../models/EmailTemplate');
const EmailCampaign = require('../models/EmailCampaign');
const EmailContactList = require('../models/ContactList');
const EmailSegment = require('../models/Segment');

const companyId = (req) => req.user.company;
const userId = (req) => req.user._id;

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const data = await DashboardService.getDashboardStats(companyId(req));
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

// Templates
exports.listTemplates = async (req, res) => {
  try {
    const result = await TemplateService.listTemplates(companyId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await TemplateService.getTemplate(companyId(req), req.params.id);
    if (!template) return error(res, 'Template not found', 404);
    return success(res, template);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await TemplateService.createTemplate(companyId(req), userId(req), req.body);
    return success(res, template, 'Template created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await TemplateService.updateTemplate(companyId(req), userId(req), req.params.id, req.body);
    return success(res, template);
  } catch (err) {
    return error(res, err.message, err.message === 'Template not found' ? 404 : 500);
  }
};

exports.duplicateTemplate = async (req, res) => {
  try {
    const template = await TemplateService.duplicateTemplate(companyId(req), userId(req), req.params.id);
    return success(res, template, 'Template duplicated', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await EmailTemplate.findOneAndDelete({ _id: req.params.id, company: companyId(req) });
    return success(res, null, 'Template deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.seedTemplates = async (req, res) => {
  try {
    const result = await TemplateService.seedPrebuiltTemplates(companyId(req), userId(req));
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.exportTemplateMjml = async (req, res) => {
  try {
    const template = await TemplateService.getTemplate(companyId(req), req.params.id);
    if (!template) return error(res, 'Template not found', 404);
    const result = await TemplateService.exportMjml(template);
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

// Campaigns
exports.listCampaigns = async (req, res) => {
  try {
    const result = await CampaignService.listCampaigns(companyId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const campaign = await CampaignService.getCampaign(companyId(req), req.params.id);
    if (!campaign) return error(res, 'Campaign not found', 404);
    return success(res, campaign);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const campaign = await CampaignService.createCampaign(companyId(req), userId(req), req.body);
    return success(res, campaign, 'Campaign created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.launchCampaign = async (req, res) => {
  try {
    const result = await CampaignService.launchCampaign(companyId(req), userId(req), req.params.id);
    return success(res, result, 'Campaign launched');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.updateCampaignStatus = async (req, res) => {
  try {
    const campaign = await CampaignService.updateCampaignStatus(companyId(req), req.params.id, req.body.status);
    return success(res, campaign);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await CampaignService.updateCampaign(companyId(req), req.params.id, req.body);
    return success(res, campaign, 'Campaign updated');
  } catch (err) {
    return error(res, err.message, err.message === 'Campaign not found' ? 404 : 400);
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await CampaignService.deleteCampaign(companyId(req), req.params.id);
    return success(res, null, 'Campaign deleted');
  } catch (err) {
    return error(res, err.message, err.message === 'Campaign not found' ? 404 : 400);
  }
};

// Emails / Inbox
exports.listEmails = async (req, res) => {
  try {
    const result = await EmailService.listEmails(companyId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getEmail = async (req, res) => {
  try {
    const email = await EmailService.getEmail(companyId(req), req.params.id);
    if (!email) return error(res, 'Email not found', 404);
    return success(res, email);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const email = await EmailService.composeAndSend(companyId(req), userId(req), req.body);
    return success(res, email, 'Email sent', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.sendTestEmail = async (req, res) => {
  try {
    const email = await EmailService.sendTestEmail(companyId(req), userId(req), req.body);
    return success(res, email, 'Test email sent');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.updateEmailFlags = async (req, res) => {
  try {
    const email = await EmailService.updateEmailFlags(companyId(req), req.params.id, req.body);
    return success(res, email);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteEmail = async (req, res) => {
  try {
    const result = await EmailService.deleteEmail(companyId(req), req.params.id, { permanent: req.query.permanent === 'true' });
    return success(res, result, req.query.permanent === 'true' ? 'Email permanently deleted' : 'Email moved to trash');
  } catch (err) {
    return error(res, err.message, err.message === 'Email not found' ? 404 : 400);
  }
};

exports.listDrafts = async (req, res) => {
  try {
    const result = await EmailService.listDrafts(companyId(req), userId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.saveDraft = async (req, res) => {
  try {
    const draft = await EmailService.saveDraft(companyId(req), userId(req), req.body);
    return success(res, draft, 'Draft saved');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getDraft = async (req, res) => {
  try {
    const draft = await EmailService.getDraft(companyId(req), userId(req), req.params.id);
    if (!draft) return error(res, 'Draft not found', 404);
    return success(res, draft);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteDraft = async (req, res) => {
  try {
    await EmailService.deleteDraft(companyId(req), userId(req), req.params.id);
    return success(res, null, 'Draft deleted');
  } catch (err) {
    return error(res, err.message, err.message === 'Draft not found' ? 404 : 400);
  }
};

exports.getLeadTimeline = async (req, res) => {
  try {
    const timeline = await EmailService.getLeadTimeline(companyId(req), req.params.leadId);
    return success(res, timeline);
  } catch (err) {
    return error(res, err.message);
  }
};

// Tracking (public)
exports.trackOpen = async (req, res) => {
  try {
    await TrackingService.recordOpen(req.params.trackingId, req);
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.send(pixel);
  } catch (_) {
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    return res.send(pixel);
  }
};

exports.trackClick = async (req, res) => {
  try {
    const result = await TrackingService.recordClick(req.params.trackingId, req.params.linkId, req.query.url, req);
    if (result?.redirectUrl) return res.redirect(result.redirectUrl);
    return res.redirect(req.query.url || '/');
  } catch (_) {
    return res.redirect(req.query.url || '/');
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const EmailMessage = require('../models/Email');
    const email = await EmailMessage.findOne({ trackingId: req.params.trackingId });
    if (email) {
      await ListService.addToSuppression(email.company, email.contactEmail, 'unsubscribe', null);
      await EmailMessage.findByIdAndUpdate(email._id, { status: 'unsubscribed' });
    }
    return res.send('<html><body><h2>You have been unsubscribed successfully.</h2></body></html>');
  } catch (_) {
    return res.status(500).send('Error processing unsubscribe');
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const data = await TrackingService.getAnalyticsOverview(companyId(req), req.query);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getCampaignAnalytics = async (req, res) => {
  try {
    const data = await TrackingService.getCampaignAnalytics(companyId(req), req.params.id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

// SMTP
exports.listSmtpAccounts = async (req, res) => {
  try {
    const accounts = await EmailSMTPAccount.find({ company: companyId(req) }).sort({ priority: 1 });
    return success(res, accounts.map(SmtpService.sanitizeAccountForResponse));
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createSmtpAccount = async (req, res) => {
  try {
    const account = await SmtpService.createAccount(companyId(req), userId(req), req.body);
    return success(res, SmtpService.sanitizeAccountForResponse(account), 'SMTP account created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.testSmtpAccount = async (req, res) => {
  try {
    const account = await EmailSMTPAccount.findOne({ _id: req.params.id, company: companyId(req) });
    if (!account) return error(res, 'Account not found', 404);
    await SmtpService.testConnection(account);
    return success(res, null, 'Connection successful');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.updateSmtpAccount = async (req, res) => {
  try {
    const account = await SmtpService.updateAccount(companyId(req), req.params.id, req.body);
    return success(res, SmtpService.sanitizeAccountForResponse(account), 'SMTP account updated');
  } catch (err) {
    return error(res, err.message, err.message === 'Account not found' ? 404 : 400);
  }
};

exports.deleteSmtpAccount = async (req, res) => {
  try {
    await SmtpService.deleteAccount(companyId(req), req.params.id);
    return success(res, null, 'SMTP account removed');
  } catch (err) {
    return error(res, err.message, err.message === 'Account not found' ? 404 : 400);
  }
};

// Domains
exports.listDomains = async (req, res) => {
  try {
    const domains = await DomainService.listDomains(companyId(req));
    return success(res, domains);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.addDomain = async (req, res) => {
  try {
    const domain = await DomainService.addDomain(companyId(req), req.body.domain);
    return success(res, domain, 'Domain added', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.verifyDomain = async (req, res) => {
  try {
    const domain = await DomainService.verifyDomain(companyId(req), req.params.id);
    return success(res, domain);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    await DomainService.deleteDomain(companyId(req), req.params.id);
    return success(res, null, 'Domain deleted');
  } catch (err) {
    return error(res, err.message, err.message === 'Domain not found' ? 404 : 400);
  }
};

// Lists
exports.listContactLists = async (req, res) => {
  try {
    const result = await ListService.listLists(companyId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createContactList = async (req, res) => {
  try {
    const list = await ListService.createList(companyId(req), userId(req), req.body);
    return success(res, list, 'List created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getContactList = async (req, res) => {
  try {
    const list = await ListService.getList(companyId(req), req.params.id);
    if (!list) return error(res, 'List not found', 404);
    return success(res, list);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateContactList = async (req, res) => {
  try {
    const list = await ListService.updateList(companyId(req), req.params.id, req.body);
    return success(res, list, 'List updated');
  } catch (err) {
    return error(res, err.message, err.message === 'List not found' ? 404 : 400);
  }
};

exports.deleteContactList = async (req, res) => {
  try {
    await ListService.deleteList(companyId(req), req.params.id);
    return success(res, null, 'List deleted');
  } catch (err) {
    return error(res, err.message, err.message === 'List not found' ? 404 : 400);
  }
};

exports.importLeadsToList = async (req, res) => {
  try {
    const list = await ListService.importFromLeads(companyId(req), req.params.id);
    return success(res, list, 'Leads imported');
  } catch (err) {
    return error(res, err.message);
  }
};

// Segments
exports.listSegments = async (req, res) => {
  try {
    const result = await SegmentService.listSegments(companyId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createSegment = async (req, res) => {
  try {
    const segment = await SegmentService.createSegment(companyId(req), userId(req), req.body);
    return success(res, segment, 'Segment created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getSegment = async (req, res) => {
  try {
    const segment = await SegmentService.getSegment(companyId(req), req.params.id);
    if (!segment) return error(res, 'Segment not found', 404);
    return success(res, segment);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateSegment = async (req, res) => {
  try {
    const segment = await SegmentService.updateSegment(companyId(req), req.params.id, req.body);
    return success(res, segment, 'Segment updated');
  } catch (err) {
    return error(res, err.message, err.message === 'Segment not found' ? 404 : 400);
  }
};

exports.deleteSegment = async (req, res) => {
  try {
    await SegmentService.deleteSegment(companyId(req), req.params.id);
    return success(res, null, 'Segment deleted');
  } catch (err) {
    return error(res, err.message, err.message === 'Segment not found' ? 404 : 400);
  }
};

exports.previewSegment = async (req, res) => {
  try {
    const preview = await SegmentService.previewSegment(companyId(req), req.body.rules);
    return success(res, preview);
  } catch (err) {
    return error(res, err.message);
  }
};

// Automation
exports.listAutomations = async (req, res) => {
  try {
    const result = await AutomationService.listAutomations(companyId(req), req.query);
    return paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createAutomation = async (req, res) => {
  try {
    const automation = await AutomationService.createAutomation(companyId(req), userId(req), req.body);
    return success(res, automation, 'Automation created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateAutomationStatus = async (req, res) => {
  try {
    const automation = await AutomationService.updateAutomationStatus(companyId(req), req.params.id, req.body.status);
    return success(res, automation);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteAutomation = async (req, res) => {
  try {
    await AutomationService.deleteAutomation(companyId(req), req.params.id);
    return success(res, null, 'Automation deleted');
  } catch (err) {
    return error(res, err.message, err.message === 'Automation not found' ? 404 : 400);
  }
};

// Suppression
exports.listSuppression = async (req, res) => {
  try {
    const items = await EmailSuppressionList.find({ company: companyId(req) }).sort({ createdAt: -1 }).limit(500);
    return success(res, items);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.addSuppression = async (req, res) => {
  try {
    const item = await ListService.addToSuppression(companyId(req), req.body.email, req.body.reason || 'manual', userId(req));
    return success(res, item, 'Added to suppression list', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteSuppression = async (req, res) => {
  try {
    await ListService.removeFromSuppression(companyId(req), req.params.id);
    return success(res, null, 'Removed from suppression list');
  } catch (err) {
    return error(res, err.message, err.message === 'Suppression entry not found' ? 404 : 400);
  }
};

// Settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await SettingsService.getSettingsForApi(companyId(req));
    return success(res, settings);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await SettingsService.updateSettings(companyId(req), userId(req), req.body);
    await TemplateService.logAction(companyId(req), userId(req), 'update_settings', 'settings', settings._id, { hasCredentials: !!req.body.credentials });
    return success(res, settings, 'Settings saved');
  } catch (err) {
    return error(res, err.message);
  }
};

// Logs
exports.getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      EmailLog.find({ company: companyId(req) }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('performedBy', 'name'),
      EmailLog.countDocuments({ company: companyId(req) }),
    ]);
    return paginated(res, items, { page, limit, total });
  } catch (err) {
    return error(res, err.message);
  }
};

// Webhooks
exports.listWebhooks = async (req, res) => {
  try {
    const webhooks = await EmailWebhook.find({ company: companyId(req) });
    return success(res, webhooks);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createWebhook = async (req, res) => {
  try {
    const webhook = await EmailWebhook.create({ ...req.body, company: companyId(req), createdBy: userId(req) });
    return success(res, webhook, 'Webhook created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const webhook = await EmailWebhook.findOneAndUpdate(
      { _id: req.params.id, company: companyId(req) },
      req.body,
      { new: true }
    );
    if (!webhook) return error(res, 'Webhook not found', 404);
    return success(res, webhook, 'Webhook updated');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const webhook = await EmailWebhook.findOneAndDelete({ _id: req.params.id, company: companyId(req) });
    if (!webhook) return error(res, 'Webhook not found', 404);
    return success(res, null, 'Webhook deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

// Attachments
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    const attachment = await AttachmentService.uploadAttachment(companyId(req), userId(req), req.file);
    return success(res, attachment, 'Attachment uploaded', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getAttachment = async (req, res) => {
  try {
    const attachment = await AttachmentService.getAttachment(companyId(req), req.params.id);
    if (!attachment) return error(res, 'Attachment not found', 404);
    return success(res, attachment);
  } catch (err) {
    return error(res, err.message);
  }
};

// IMAP Sync
exports.getImapSyncStatus = async (req, res) => {
  try {
    const status = await ImapSyncService.getSyncStatus(companyId(req));
    return success(res, status);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.syncImap = async (req, res) => {
  try {
    const { addImapSyncJob } = require('../queues/index');
    const accountId = req.params.accountId || req.body.accountId;
    if (!accountId) return error(res, 'accountId required', 400);

    const job = await addImapSyncJob({ accountId, companyId: companyId(req).toString() });
    if (job?.processedSync) {
      return success(res, job.result, 'IMAP sync completed');
    }
    return success(res, { queued: true }, 'IMAP sync queued');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.configureImap = async (req, res) => {
  try {
    const account = await ImapSyncService.configureImap(companyId(req), req.params.accountId, req.body);
    return success(res, account, 'IMAP configured');
  } catch (err) {
    return error(res, err.message);
  }
};

// OAuth (callback handlers are public)
exports.getOAuthUrls = async (req, res) => {
  try {
    const urls = OAuthService.getAuthUrls(companyId(req), userId(req));
    return success(res, urls);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.googleOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return error(res, 'Authorization code missing', 400);
    const { redirectUrl } = await OAuthService.handleGoogleCallback(code, state);
    return res.redirect(redirectUrl);
  } catch (err) {
    const failUrl = `${OAuthService.getFrontendRedirect().replace('success', 'error')}&message=${encodeURIComponent(err.message)}`;
    return res.redirect(failUrl);
  }
};

exports.microsoftOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return error(res, 'Authorization code missing', 400);
    const { redirectUrl } = await OAuthService.handleMicrosoftCallback(code, state);
    return res.redirect(redirectUrl);
  } catch (err) {
    const failUrl = `${OAuthService.getFrontendRedirect().replace('success', 'error')}&message=${encodeURIComponent(err.message)}`;
    return res.redirect(failUrl);
  }
};

// Email testing
exports.runEmailTests = async (req, res) => {
  try {
    const results = EmailTestService.runEmailTests(req.body);
    return success(res, results);
  } catch (err) {
    return error(res, err.message);
  }
};

// Heatmaps
exports.getEmailHeatmap = async (req, res) => {
  try {
    const data = await HeatmapService.getEmailHeatmap(companyId(req), req.params.emailId);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 404);
  }
};

exports.getCampaignHeatmap = async (req, res) => {
  try {
    const data = await HeatmapService.getCampaignHeatmap(companyId(req), req.params.id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

// A/B Testing
exports.evaluateAbWinner = async (req, res) => {
  try {
    const result = await AbTestService.evaluateWinner(companyId(req), req.params.id);
    return success(res, result, 'A/B test winner selected and holdback sent');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

// Automation builder
exports.getAutomation = async (req, res) => {
  try {
    const automation = await AutomationService.getAutomation(companyId(req), req.params.id);
    if (!automation) return error(res, 'Automation not found', 404);
    return success(res, automation);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateAutomation = async (req, res) => {
  try {
    const automation = await AutomationService.updateAutomation(companyId(req), req.params.id, req.body);
    return success(res, automation);
  } catch (err) {
    return error(res, err.message);
  }
};
