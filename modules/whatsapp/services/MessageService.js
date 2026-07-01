const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppApiClient = require('./WhatsAppApiService');
const SettingsService = require('./SettingsService');
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const WhatsAppActivityLog = require('../models/WhatsAppActivityLog');
const LeadActivity = require('../../../models/LeadActivity');
const { getIO } = require('../events/socketBridge');

/**
 * Message sending and receiving service.
 */
class MessageService {
  /**
   * Store inbound message from webhook.
   * @param {object} params
   * @returns {Promise<object>}
   */
  async storeInbound(params) {
    const {
      companyId, conversationId, contactId, waMessageId,
      type, content, mediaUrl, mediaMimeType, mediaFilename,
      mediaId, location, contactCard, interactivePayload, leadId,
    } = params;

    const message = await WhatsAppMessage.create({
      company: companyId,
      conversation: conversationId,
      contact: contactId,
      waMessageId,
      direction: 'inbound',
      type,
      content,
      mediaUrl,
      mediaMimeType,
      mediaFilename,
      mediaId,
      location,
      contactCard,
      interactivePayload,
      status: 'delivered',
      deliveredAt: new Date(),
    });

    await WhatsAppConversation.findByIdAndUpdate(conversationId, {
      lastMessage: content || `[${type}]`,
      lastMessageAt: new Date(),
      lastMessageDirection: 'inbound',
      lastMessageStatus: 'delivered',
      $inc: { unreadCount: 1 },
    });

    if (leadId) {
      await LeadActivity.create({
        company: companyId,
        leadId,
        action: 'note_added',
        details: `WhatsApp message received: ${content?.slice(0, 100) || type}`,
        ipAddress: '0.0.0.0',
        userAgent: 'WhatsApp-Webhook',
      });

      await WhatsAppActivityLog.create({
        company: companyId,
        lead: leadId,
        conversation: conversationId,
        message: message._id,
        action: 'incoming_message',
        details: content?.slice(0, 200) || type,
      });
    }

    this.emitRealtime('whatsapp:new_message', companyId, {
      message,
      conversationId,
      direction: 'inbound',
    });

    return message;
  }

  /**
   * Send outbound message via WhatsApp API.
   * @param {object} params
   * @returns {Promise<object>}
   */
  async sendOutbound(params) {
    const {
      companyId, conversationId, contactId, phone, userId,
      type = 'text', content, mediaUrl, templateName,
      templateLanguage, templateComponents, replyTo, leadId,
    } = params;

    const startTime = Date.now();
    const settings = await SettingsService.getDecryptedByCompany(companyId);
    if (!settings?.accessToken) {
      throw new Error('WhatsApp not configured for this company');
    }

    const client = WhatsAppApiClient.fromSettings(settings);
    let apiResponse;

    try {
      if (type === 'template' && templateName) {
        apiResponse = await client.sendTemplateMessage(
          phone, templateName, templateLanguage || 'en', templateComponents || []
        );
      } else if (['image', 'video', 'audio', 'document'].includes(type) && mediaUrl) {
        apiResponse = await client.sendMediaMessage(phone, type, { link: mediaUrl }, content);
      } else {
        apiResponse = await client.sendTextMessage(phone, content);
      }
    } catch (err) {
      await WhatsAppMessageLog.create({
        company: companyId,
        direction: 'outgoing',
        endpoint: '/messages',
        requestBody: params,
        error: err.message,
        responseTimeMs: Date.now() - startTime,
        statusCode: err.response?.status || 500,
      });
      throw err;
    }

    const waMessageId = apiResponse?.messages?.[0]?.id;

    const message = await WhatsAppMessage.create({
      company: companyId,
      conversation: conversationId,
      contact: contactId,
      waMessageId,
      direction: 'outbound',
      type: type === 'template' ? 'template' : type,
      content,
      mediaUrl,
      templateName,
      templateLanguage,
      templateComponents,
      replyTo,
      sentBy: userId,
      status: 'sent',
      sentAt: new Date(),
    });

    await WhatsAppConversation.findByIdAndUpdate(conversationId, {
      lastMessage: content || `[${type}]`,
      lastMessageAt: new Date(),
      lastMessageDirection: 'outbound',
      lastMessageStatus: 'sent',
    });

    await WhatsAppMessageLog.create({
      company: companyId,
      direction: 'outgoing',
      endpoint: '/messages',
      requestBody: { type, content, phone },
      responseBody: apiResponse,
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      waMessageId,
    });

    if (leadId) {
      const action = type === 'template' ? 'whatsapp_temp_sent' : 'note_added';
      await LeadActivity.create({
        company: companyId,
        leadId,
        userId,
        action,
        details: `WhatsApp ${type} sent: ${content?.slice(0, 100) || templateName}`,
        ipAddress: '0.0.0.0',
      });

      await WhatsAppActivityLog.create({
        company: companyId,
        lead: leadId,
        conversation: conversationId,
        message: message._id,
        user: userId,
        action: type === 'template' ? 'template_sent' : 'outgoing_message',
        details: content?.slice(0, 200) || templateName,
      });
    }

    this.emitRealtime('whatsapp:new_message', companyId, {
      message,
      conversationId,
      direction: 'outbound',
    });

    return message;
  }

  /**
   * Update message delivery/read status from webhook.
   * @param {string} waMessageId
   * @param {string} status
   * @returns {Promise<object|null>}
   */
  async updateStatus(waMessageId, status) {
    const update = { status };
    if (status === 'delivered') update.deliveredAt = new Date();
    if (status === 'read') {
      update.readAt = new Date();
      update.status = 'read';
    }
    if (status === 'failed') update.status = 'failed';

    const message = await WhatsAppMessage.findOneAndUpdate(
      { waMessageId },
      update,
      { new: true }
    );

    if (message) {
      await WhatsAppConversation.findByIdAndUpdate(message.conversation, {
        lastMessageStatus: message.status,
      });

      this.emitRealtime('whatsapp:message_status', message.company.toString(), {
        messageId: message._id,
        waMessageId,
        status: message.status,
        conversationId: message.conversation,
      });
    }

    return message;
  }

  /**
   * Get messages for conversation with pagination.
   * @param {string} conversationId
   * @param {string} companyId
   * @param {object} options
   * @returns {Promise<{items: Array, total: number}>}
   */
  async getMessages(conversationId, companyId, { page = 1, limit = 50, search } = {}) {
    const query = { conversation: conversationId, company: companyId, isInternal: false };
    if (search) query.content = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WhatsAppMessage.find(query)
        .populate('sentBy', 'firstName lastName profilePicture')
        .populate('replyTo', 'content type direction')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WhatsAppMessage.countDocuments(query),
    ]);

    return { items: items.reverse(), total };
  }

  /**
   * Mark conversation messages as read.
   * @param {string} conversationId
   * @param {string} companyId
   * @returns {Promise<void>}
   */
  async markConversationRead(conversationId, companyId) {
    await WhatsAppConversation.findOneAndUpdate(
      { _id: conversationId, company: companyId },
      { unreadCount: 0 }
    );

    const unreadInbound = await WhatsAppMessage.find({
      conversation: conversationId,
      direction: 'inbound',
      status: { $ne: 'read' },
    });

    const settings = await SettingsService.getDecryptedByCompany(companyId);
    if (settings?.accessToken) {
      const client = WhatsAppApiClient.fromSettings(settings);
      for (const msg of unreadInbound) {
        if (msg.waMessageId) {
          try {
            await client.markAsRead(msg.waMessageId);
          } catch (_) { /* best effort */ }
        }
      }
    }

    await WhatsAppMessage.updateMany(
      { conversation: conversationId, direction: 'inbound', status: { $ne: 'read' } },
      { status: 'read', readAt: new Date() }
    );
  }

  /**
   * @param {string} event
   * @param {string} companyId
   * @param {object} data
   */
  emitRealtime(event, companyId, data) {
    try {
      const io = getIO();
      if (io) {
        io.to(`company_${companyId}`).emit(event, data);
      }
    } catch (_) { /* socket optional during init */ }
  }
}

module.exports = new MessageService();
