const SettingsService = require('../services/SettingsService');
const ConversationService = require('../services/ConversationService');
const MessageService = require('../services/MessageService');
const WebhookService = require('../services/WebhookService');
const QuickReplyService = require('../services/QuickReplyService');
const BroadcastService = require('../services/BroadcastService');
const ReportsService = require('../services/ReportsService');
const WhatsAppMessageTemplate = require('../models/WhatsAppMessageTemplate');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppChatNote = require('../models/WhatsAppChatNote');
const WhatsAppMediaFile = require('../models/WhatsAppMediaFile');
const WhatsAppChatbotFlow = require('../models/WhatsAppChatbotFlow');
const WhatsAppAutomationRule = require('../models/WhatsAppAutomationRule');
const WhatsAppScheduledMessage = require('../models/WhatsAppScheduledMessage');
const WhatsAppActivityLog = require('../models/WhatsAppActivityLog');
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const WhatsAppContact = require('../models/WhatsAppContact');
const WhatsAppApiClient = require('../services/WhatsAppApiService');
const SettingsServiceInstance = require('../services/SettingsService');
const { success, error, paginated } = require('../utils/apiResponse');

function getCompanyId(req) {
  return req.user?.company?._id || req.user?.company;
}

exports.getSettings = async (req, res) => {
  try {
    const settings = await SettingsService.getByCompany(getCompanyId(req));
    return success(res, settings || {});
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await SettingsService.upsert(getCompanyId(req), req.body, req.user._id);
    return success(res, settings, 'Settings updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.testConnection = async (req, res) => {
  try {
    const result = await SettingsService.testConnection(getCompanyId(req));
    return success(res, result, 'Connection successful');
  } catch (err) {
    await SettingsService.upsert(getCompanyId(req), { apiConnectionStatus: 'error' }, req.user._id);
    return error(res, err.message, 400);
  }
};

exports.verifyWebhook = async (req, res) => {
  try {
    const challenge = await WebhookService.verifyWebhook(req.query);
    if (challenge) return res.status(200).send(challenge);
    return res.sendStatus(403);
  } catch (err) {
    return res.sendStatus(403);
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'] || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);
    await WebhookService.processWebhook(req.body, rawBody, signature);
    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.sendStatus(200);
  }
};

exports.listConversations = async (req, res) => {
  try {
    const { page, limit, status, search, filter, assignedTo } = req.query;
    const result = await ConversationService.list({
      companyId: getCompanyId(req),
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      status,
      search,
      filter,
      assignedTo,
      userId: req.user._id,
      userRole: req.user.role,
    });
    return paginated(res, result.items, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      total: result.total,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getConversation = async (req, res) => {
  try {
    const WhatsAppConversation = require('../models/WhatsAppConversation');
    const conversation = await WhatsAppConversation.findOne({
      _id: req.params.id,
      company: getCompanyId(req),
    })
      .populate('contact')
      .populate('assignedTo', 'firstName lastName email')
      .populate('lead');
    if (!conversation) return error(res, 'Conversation not found', 404);
    return success(res, conversation);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await MessageService.getMessages(req.params.id, getCompanyId(req), {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search,
    });
    return paginated(res, result.items, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      total: result.total,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const conversation = await require('../models/WhatsAppConversation').findOne({
      _id: req.params.id,
      company: getCompanyId(req),
    }).populate('contact');
    if (!conversation) return error(res, 'Conversation not found', 404);

    const message = await MessageService.sendOutbound({
      companyId: getCompanyId(req),
      conversationId: conversation._id,
      contactId: conversation.contact._id,
      phone: conversation.contact.phone,
      userId: req.user._id,
      leadId: conversation.lead,
      ...req.body,
    });
    return success(res, message, 'Message sent', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.markRead = async (req, res) => {
  try {
    await MessageService.markConversationRead(req.params.id, getCompanyId(req));
    return success(res, null, 'Marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.assignConversation = async (req, res) => {
  try {
    const conversation = await ConversationService.assign({
      conversationId: req.params.id,
      companyId: getCompanyId(req),
      assignedTo: req.body.assignedTo,
      assignedBy: req.user._id,
      type: req.body.type || 'manual',
      notes: req.body.notes,
    });
    return success(res, conversation, 'Conversation assigned');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.updateConversationStatus = async (req, res) => {
  try {
    const conversation = await ConversationService.updateStatus(
      req.params.id, getCompanyId(req), req.body.status, req.user._id
    );
    return success(res, conversation);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.togglePin = async (req, res) => {
  try {
    const conversation = await ConversationService.togglePin(
      req.params.id, getCompanyId(req), req.body.isPinned
    );
    return success(res, conversation);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.listQuickReplies = async (req, res) => {
  try {
    const items = await QuickReplyService.list(getCompanyId(req), req.query);
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createQuickReply = async (req, res) => {
  try {
    const item = await QuickReplyService.create(getCompanyId(req), req.body, req.user._id);
    return success(res, item, 'Quick reply created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.renderQuickReply = async (req, res) => {
  try {
    const content = await QuickReplyService.render(req.params.id, getCompanyId(req), req.body.variables);
    return success(res, { content });
  } catch (err) {
    return error(res, err.message, 404);
  }
};

exports.listTemplates = async (req, res) => {
  try {
    const items = await WhatsAppMessageTemplate.find({ company: getCompanyId(req) }).sort({ createdAt: -1 });
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const item = await WhatsAppMessageTemplate.create({
      ...req.body,
      company: getCompanyId(req),
      createdBy: req.user._id,
    });
    return success(res, item, 'Template created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.syncTemplates = async (req, res) => {
  try {
    const settings = await SettingsServiceInstance.getDecryptedByCompany(getCompanyId(req));
    const client = WhatsAppApiClient.fromSettings(settings);
    const metaTemplates = await client.listTemplates();
    return success(res, metaTemplates);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.listBroadcasts = async (req, res) => {
  try {
    const result = await BroadcastService.list(getCompanyId(req), req.query);
    return paginated(res, result.items, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      total: result.total,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createBroadcast = async (req, res) => {
  try {
    const broadcast = await BroadcastService.create(getCompanyId(req), req.body, req.user._id);
    return success(res, broadcast, 'Broadcast created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.listCampaigns = async (req, res) => {
  try {
    const items = await WhatsAppCampaign.find({ company: getCompanyId(req) }).sort({ createdAt: -1 });
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const item = await WhatsAppCampaign.create({
      ...req.body,
      company: getCompanyId(req),
      createdBy: req.user._id,
    });
    return success(res, item, 'Campaign created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.getReports = async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const [metrics, chartData, agentPerformance] = await Promise.all([
      ReportsService.getDashboardMetrics(getCompanyId(req), startDate, endDate),
      ReportsService.getChartData(getCompanyId(req), period, parseInt(days, 10)),
      ReportsService.getAgentPerformance(getCompanyId(req), startDate, endDate),
    ]);

    return success(res, { metrics, chartData, agentPerformance });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getLeadTimeline = async (req, res) => {
  try {
    const items = await WhatsAppActivityLog.find({
      company: getCompanyId(req),
      lead: req.params.leadId,
    }).sort({ createdAt: -1 }).limit(100);
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getContactProfile = async (req, res) => {
  try {
    const conversation = await require('../models/WhatsAppConversation').findOne({
      _id: req.params.id,
      company: getCompanyId(req),
    }).populate({
      path: 'lead',
      populate: [
        { path: 'assignedTo', select: 'firstName lastName' },
        { path: 'Customer' },
      ],
    }).populate('contact');

    if (!conversation) return error(res, 'Not found', 404);

    const timeline = await WhatsAppActivityLog.find({
      lead: conversation.lead?._id,
    }).sort({ createdAt: -1 }).limit(20);

    return success(res, { conversation, timeline });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.addNote = async (req, res) => {
  try {
    const note = await WhatsAppChatNote.create({
      company: getCompanyId(req),
      conversation: req.params.id,
      author: req.user._id,
      content: req.body.content,
      type: req.body.type || 'note',
      mentions: req.body.mentions,
    });
    return success(res, note, 'Note added', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.listNotes = async (req, res) => {
  try {
    const notes = await WhatsAppChatNote.find({
      conversation: req.params.id,
      company: getCompanyId(req),
    }).populate('author', 'firstName lastName').sort({ createdAt: -1 });
    return success(res, notes);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.listMedia = async (req, res) => {
  try {
    const query = { company: getCompanyId(req) };
    if (req.query.folder) query.folder = req.query.folder;
    if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
    const items = await WhatsAppMediaFile.find(query).sort({ createdAt: -1 });
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.listAutomations = async (req, res) => {
  try {
    const items = await WhatsAppAutomationRule.find({ company: getCompanyId(req) });
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createAutomation = async (req, res) => {
  try {
    const item = await WhatsAppAutomationRule.create({
      ...req.body,
      company: getCompanyId(req),
      createdBy: req.user._id,
    });
    return success(res, item, 'Automation created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.listChatbotFlows = async (req, res) => {
  try {
    const items = await WhatsAppChatbotFlow.find({ company: getCompanyId(req) });
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createChatbotFlow = async (req, res) => {
  try {
    const item = await WhatsAppChatbotFlow.create({
      ...req.body,
      company: getCompanyId(req),
      createdBy: req.user._id,
    });
    return success(res, item, 'Chatbot flow created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.listScheduled = async (req, res) => {
  try {
    const items = await WhatsAppScheduledMessage.find({
      company: getCompanyId(req),
      status: 'scheduled',
    }).sort({ scheduledAt: 1 });
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createScheduled = async (req, res) => {
  try {
    const item = await WhatsAppScheduledMessage.create({
      ...req.body,
      company: getCompanyId(req),
      createdBy: req.user._id,
    });

    const delayMs = new Date(item.scheduledAt).getTime() - Date.now();
    if (delayMs > 0) {
      const { addScheduledJob } = require('../queues/index');
      await addScheduledJob({ scheduledMessageId: item._id.toString() }, delayMs);
    }

    return success(res, item, 'Message scheduled', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

exports.getMessageLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const query = { company: getCompanyId(req) };
    const [items, total] = await Promise.all([
      WhatsAppMessageLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      WhatsAppMessageLog.countDocuments(query),
    ]);
    return paginated(res, items, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.previewBroadcastRecipients = async (req, res) => {
  try {
    const recipients = await BroadcastService.resolveRecipients(getCompanyId(req), req.body.filters);
    return success(res, { count: recipients.length, sample: recipients.slice(0, 10) });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
