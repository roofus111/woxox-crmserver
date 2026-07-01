const WhatsAppSettings = require('../models/WhatsAppSettings');
const { encrypt, decrypt, maskSecret } = require('../utils/encryption');
const WhatsAppApiClient = require('./WhatsAppApiService');
const redisService = require('../../../config/redis');

const SENSITIVE_FIELDS = ['metaAppSecret', 'accessToken'];
const CACHE_TTL = 300;

/**
 * Settings service with encrypted credential storage.
 */
class SettingsService {
  /**
   * @param {string} companyId
   * @returns {Promise<object|null>}
   */
  async getByCompany(companyId) {
    const cacheKey = `wa:settings:${companyId}`;
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) return cached;
    } catch (_) { /* redis optional */ }

    const settings = await WhatsAppSettings.findOne({ company: companyId }).lean();
    if (!settings) return null;

    const sanitized = this.sanitizeForResponse(settings);
    try {
      await redisService.set(cacheKey, sanitized, CACHE_TTL);
    } catch (_) { /* redis optional */ }
    return sanitized;
  }

  /**
   * Get decrypted settings for internal API use.
   * @param {string} companyId
   * @returns {Promise<object|null>}
   */
  async getDecryptedByCompany(companyId) {
    const settings = await WhatsAppSettings.findOne({ company: companyId });
    if (!settings) return null;
    return {
      ...settings.toObject(),
      metaAppSecret: settings.metaAppSecret ? decrypt(settings.metaAppSecret) : '',
      accessToken: settings.accessToken ? decrypt(settings.accessToken) : '',
    };
  }

  /**
   * @param {string} companyId
   * @param {object} data
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async upsert(companyId, data, userId = null) {
    const update = { ...data };
    if (userId) update.updatedBy = userId;

    for (const field of SENSITIVE_FIELDS) {
      if (update[field] && !update[field].includes(':')) {
        update[field] = encrypt(update[field]);
      } else if (update[field] === '') {
        delete update[field];
      }
    }

    if (!update.verifyToken) {
      update.verifyToken = `wa_${companyId}_${Date.now()}`;
    }

    const settings = await WhatsAppSettings.findOneAndUpdate(
      { company: companyId },
      { $set: update, $setOnInsert: { company: companyId } },
      { new: true, upsert: true, runValidators: true }
    );

    try {
      await redisService.del(`wa:settings:${companyId}`);
    } catch (_) { /* redis optional */ }

    return this.sanitizeForResponse(settings.toObject());
  }

  /**
   * @param {string} companyId
   * @returns {Promise<object>}
   */
  async testConnection(companyId) {
    const decrypted = await this.getDecryptedByCompany(companyId);
    if (!decrypted?.phoneNumberId || !decrypted?.accessToken) {
      throw new Error('Phone Number ID and Access Token are required');
    }

    const client = new WhatsAppApiClient(decrypted);
    const result = await client.testConnection();

    await WhatsAppSettings.findOneAndUpdate(
      { company: companyId },
      {
        apiConnectionStatus: 'connected',
        lastConnectionTestAt: new Date(),
      }
    );

    return result;
  }

  /**
   * Find settings by phone number ID (for webhooks).
   * @param {string} phoneNumberId
   * @returns {Promise<object|null>}
   */
  async findByPhoneNumberId(phoneNumberId) {
    return WhatsAppSettings.findOne({ phoneNumberId, isActive: true });
  }

  /**
   * @param {object} settings
   * @returns {object}
   */
  sanitizeForResponse(settings) {
    const copy = { ...settings };
    for (const field of SENSITIVE_FIELDS) {
      if (copy[field]) copy[field] = maskSecret(decrypt(copy[field]));
    }
    return copy;
  }
}

module.exports = new SettingsService();
