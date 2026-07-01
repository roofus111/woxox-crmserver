const WhatsAppQuickReply = require('../models/WhatsAppQuickReply');

/**
 * Quick reply management with variable substitution.
 */
class QuickReplyService {
  /**
   * @param {string} companyId
   * @param {object} filters
   * @returns {Promise<Array>}
   */
  async list(companyId, { category, search, favoritesOnly } = {}) {
    const query = { company: companyId };
    if (category) query.category = category;
    if (favoritesOnly) query.isFavorite = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }
    return WhatsAppQuickReply.find(query).sort({ isFavorite: -1, usageCount: -1 });
  }

  /**
   * @param {string} companyId
   * @param {object} data
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async create(companyId, data, userId) {
    return WhatsAppQuickReply.create({ ...data, company: companyId, createdBy: userId });
  }

  /**
   * Apply variable substitution to quick reply content.
   * @param {string} content
   * @param {object} variables
   * @returns {string}
   */
  applyVariables(content, variables = {}) {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

  /**
   * @param {string} id
   * @param {string} companyId
   * @param {object} variables
   * @returns {Promise<string>}
   */
  async render(id, companyId, variables) {
    const reply = await WhatsAppQuickReply.findOne({ _id: id, company: companyId });
    if (!reply) throw new Error('Quick reply not found');
    await WhatsAppQuickReply.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
    return this.applyVariables(reply.content, variables);
  }
}

module.exports = new QuickReplyService();
