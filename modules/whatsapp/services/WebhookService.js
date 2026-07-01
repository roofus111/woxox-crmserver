const crypto = require('crypto');
const SettingsService = require('./SettingsService');
const LeadCreationService = require('./LeadCreationService');
const ConversationService = require('./ConversationService');
const MessageService = require('./MessageService');
const WhatsAppWebhookEvent = require('../models/WhatsAppWebhookEvent');
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const SettingsServiceInstance = require('./SettingsService');
const { decrypt } = require('../utils/encryption');
const { getIO } = require('../events/socketBridge');

const WhatsAppSettings = require('../models/WhatsAppSettings');

/**
 * Processes WhatsApp Cloud API webhook payloads.
 */
class WebhookService {
  /**
   * Verify webhook subscription (GET challenge).
   * @param {object} query
   * @returns {Promise<string|null>}
   */
  async verifyWebhook(query) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode !== 'subscribe' || !token || !challenge) return null;

    const settings = await WhatsAppSettings.findOne({ verifyToken: token, isActive: true });
    if (settings) return challenge;

    return null;
  }

  /**
   * Verify webhook signature from Meta.
   * @param {string} rawBody
   * @param {string} signature
   * @param {string} appSecret
   * @returns {boolean}
   */
  verifySignature(rawBody, signature, appSecret) {
    if (!signature || !appSecret) return false;
    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');
    const received = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }

  /**
   * Process incoming webhook POST.
   * @param {object} body
   * @param {string} [rawBody]
   * @param {string} [signature]
   * @returns {Promise<void>}
   */
  async processWebhook(body, rawBody = '', signature = '') {
    const startTime = Date.now();

    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;
        const settings = await SettingsService.findByPhoneNumberId(phoneNumberId);

        if (!settings) {
          console.warn(`No settings found for phone_number_id: ${phoneNumberId}`);
          continue;
        }

        const companyId = settings.company.toString();

        if (signature && settings.metaAppSecret) {
          const appSecret = decrypt(settings.metaAppSecret);
          if (!this.verifySignature(rawBody, signature, appSecret)) {
            throw new Error('Invalid webhook signature');
          }
        }

        await WhatsAppWebhookEvent.create({
          company: companyId,
          eventType: 'messages',
          payload: value,
          signature,
          isVerified: true,
          processed: false,
        });

        await SettingsServiceInstance.upsert(companyId, {
          lastWebhookAt: new Date(),
          webhookStatus: 'verified',
        }, null);

        if (value.messages) {
          for (const msg of value.messages) {
            await this.handleIncomingMessage(companyId, settings, msg, value.contacts);
          }
        }

        if (value.statuses) {
          for (const status of value.statuses) {
            await MessageService.updateStatus(status.id, status.status);
          }
        }
      }
    }

    await WhatsAppMessageLog.create({
      direction: 'webhook',
      endpoint: '/webhook',
      requestBody: body,
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
    });
  }

  /**
   * Handle a single incoming message.
   * @param {string} companyId
   * @param {object} settings
   * @param {object} msg
   * @param {Array} contacts
   * @returns {Promise<void>}
   */
  async handleIncomingMessage(companyId, settings, msg, contacts = []) {
    const phone = msg.from;
    const contactInfo = contacts.find((c) => c.wa_id === phone);
    const contactName = contactInfo?.profile?.name || '';

    const decryptedSettings = {
      ...settings.toObject(),
      accessToken: settings.accessToken ? decrypt(settings.accessToken) : '',
      defaultCountryCode: settings.defaultCountryCode,
      autoLeadCreation: settings.autoLeadCreation,
      autoAssignment: settings.autoAssignment,
      assignmentMode: settings.assignmentMode,
      defaultAgent: settings.defaultAgent,
      roundRobinIndex: settings.roundRobinIndex,
    };

    const { lead, contact, isNew } = await LeadCreationService.findOrCreateFromWhatsApp({
      companyId,
      phone,
      contactName,
      settings: decryptedSettings,
    });

    if (!contact) return;

    const conversation = await ConversationService.getOrCreate(
      companyId,
      contact._id,
      lead?._id
    );

    if (isNew && lead && settings.autoAssignment && !conversation.assignedTo) {
      const assignee = await LeadCreationService.resolveAssignee(companyId, decryptedSettings);
      if (assignee) {
        await ConversationService.assign({
          conversationId: conversation._id,
          companyId,
          assignedTo: assignee,
          assignedBy: assignee,
          type: 'auto',
        });
        this.notifyAssignment(companyId, assignee, conversation._id, lead);
      }
    }

    const parsed = this.parseMessagePayload(msg);

    await MessageService.storeInbound({
      companyId,
      conversationId: conversation._id,
      contactId: contact._id,
      waMessageId: msg.id,
      leadId: lead?._id,
      ...parsed,
    });

    if (isNew && lead) {
      this.notifyNewLead(companyId, lead, conversation._id);
    }

    const settingsDecrypted = decryptedSettings;
    if (settingsDecrypted.accessToken && msg.id) {
      try {
        const WhatsAppApiClient = require('./WhatsAppApiService');
        const client = new WhatsAppApiClient(settingsDecrypted);
        await client.markAsRead(msg.id);
      } catch (_) { /* best effort */ }
    }
  }

  /**
   * Parse WhatsApp message payload into internal format.
   * @param {object} msg
   * @returns {object}
   */
  parseMessagePayload(msg) {
    const base = { type: msg.type, content: '' };

    switch (msg.type) {
      case 'text':
        base.content = msg.text?.body || '';
        break;
      case 'image':
        base.mediaId = msg.image?.id;
        base.mediaMimeType = msg.image?.mime_type;
        base.content = msg.image?.caption || '';
        break;
      case 'video':
        base.mediaId = msg.video?.id;
        base.mediaMimeType = msg.video?.mime_type;
        base.content = msg.video?.caption || '';
        break;
      case 'audio':
      case 'voice':
        base.type = msg.type === 'voice' ? 'voice' : 'audio';
        base.mediaId = msg[msg.type]?.id;
        base.mediaMimeType = msg[msg.type]?.mime_type;
        break;
      case 'document':
        base.type = msg.document?.mime_type?.includes('pdf') ? 'pdf' : 'document';
        base.mediaId = msg.document?.id;
        base.mediaFilename = msg.document?.filename;
        base.mediaMimeType = msg.document?.mime_type;
        base.content = msg.document?.caption || '';
        break;
      case 'location':
        base.location = {
          latitude: msg.location?.latitude,
          longitude: msg.location?.longitude,
          name: msg.location?.name,
          address: msg.location?.address,
        };
        base.content = msg.location?.name || 'Location shared';
        break;
      case 'contacts':
        base.type = 'contact';
        base.contactCard = msg.contacts;
        base.content = 'Contact card shared';
        break;
      case 'interactive':
        base.interactivePayload = msg.interactive;
        base.content = msg.interactive?.button_reply?.title
          || msg.interactive?.list_reply?.title
          || 'Interactive response';
        break;
      case 'button':
        base.content = msg.button?.text || msg.button?.payload || '';
        break;
      default:
        base.content = `[${msg.type}]`;
    }

    return base;
  }

  /**
   * @param {string} companyId
   * @param {object} lead
   * @param {string} conversationId
   */
  notifyNewLead(companyId, lead, conversationId) {
    try {
      const io = getIO();
      if (io) {
        io.to(`company_${companyId}`).emit('whatsapp:new_lead', {
          lead,
          conversationId,
        });
      }
    } catch (_) { /* optional */ }
  }

  /**
   * @param {string} companyId
   * @param {string} userId
   * @param {string} conversationId
   * @param {object} lead
   */
  notifyAssignment(companyId, userId, conversationId, lead) {
    try {
      const io = getIO();
      if (io) {
        io.to(userId.toString()).emit('whatsapp:conversation_assigned', {
          conversationId,
          lead,
        });
        io.to(`company_${companyId}`).emit('whatsapp:assignment_changed', {
          conversationId,
          assignedTo: userId,
        });
      }
    } catch (_) { /* optional */ }
  }
}

module.exports = new WebhookService();
