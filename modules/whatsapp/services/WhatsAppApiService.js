const axios = require('axios');
const { decrypt } = require('../utils/encryption');

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * WhatsApp Cloud API client for Meta Graph API.
 */
class WhatsAppApiClient {
  /**
   * @param {object} settings - Decrypted WhatsApp settings
   */
  constructor(settings) {
    this.settings = settings;
    this.phoneNumberId = settings.phoneNumberId;
    this.accessToken = settings.accessToken;
  }

  /**
   * Creates client from encrypted settings document.
   * @param {object} settingsDoc
   * @returns {WhatsAppApiClient}
   */
  static fromSettings(settingsDoc) {
    return new WhatsAppApiClient({
      phoneNumberId: settingsDoc.phoneNumberId,
      accessToken: decrypt(settingsDoc.accessToken),
      businessAccountId: settingsDoc.businessAccountId,
    });
  }

  /**
   * @param {string} method
   * @param {string} endpoint
   * @param {object} [data]
   * @returns {Promise<object>}
   */
  async request(method, endpoint, data = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${GRAPH_BASE_URL}${endpoint}`;
    const config = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  }

  /**
   * Test API connection by fetching phone number details.
   * @returns {Promise<object>}
   */
  async testConnection() {
    return this.request('GET', `/${this.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`);
  }

  /**
   * Send a text message.
   * @param {string} to - Recipient phone (E.164 without +)
   * @param {string} text
   * @returns {Promise<object>}
   */
  async sendTextMessage(to, text) {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    });
  }

  /**
   * Send a template message.
   * @param {string} to
   * @param {string} templateName
   * @param {string} languageCode
   * @param {Array} components
   * @returns {Promise<object>}
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    return this.sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  /**
   * Send media message.
   * @param {string} to
   * @param {string} type - image|video|audio|document
   * @param {object} media - { link } or { id }
   * @param {string} [caption]
   * @returns {Promise<object>}
   */
  async sendMediaMessage(to, type, media, caption = '') {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      [type]: { ...media, ...(caption && type !== 'audio' ? { caption } : {}) },
    };
    return this.sendMessage(payload);
  }

  /**
   * Mark message as read.
   * @param {string} messageId
   * @returns {Promise<object>}
   */
  async markAsRead(messageId) {
    return this.request('POST', `/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }

  /**
   * Get media URL from media ID.
   * @param {string} mediaId
   * @returns {Promise<object>}
   */
  async getMediaUrl(mediaId) {
    return this.request('GET', `/${mediaId}`);
  }

  /**
   * Download media binary.
   * @param {string} url
   * @returns {Promise<Buffer>}
   */
  async downloadMedia(url) {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * List message templates from Meta.
   * @returns {Promise<object>}
   */
  async listTemplates() {
    const wabaId = this.settings.businessAccountId;
    return this.request('GET', `/${wabaId}/message_templates?limit=100`);
  }

  /**
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async sendMessage(payload) {
    return this.request('POST', `/${this.phoneNumberId}/messages`, payload);
  }
}

module.exports = WhatsAppApiClient;
