const Lead = require('../../../models/Lead');
const WhatsAppBroadcast = require('../models/WhatsAppBroadcast');
const WhatsAppContact = require('../models/WhatsAppContact');
const { addBroadcastJob } = require('../queues/index');

/**
 * Broadcast bulk messaging service.
 */
class BroadcastService {
  /**
   * Build recipient list from filters.
   * @param {string} companyId
   * @param {object} filters
   * @returns {Promise<Array>}
   */
  async resolveRecipients(companyId, filters = {}) {
    const leadQuery = { company: companyId };

    if (filters.leadStatus?.length) leadQuery.status = { $in: filters.leadStatus };
    if (filters.assignedCounselor?.length) leadQuery.assignedTo = { $in: filters.assignedCounselor };
    if (filters.tags?.length) leadQuery.tags = { $in: filters.tags };
    if (filters.country?.length) leadQuery['profile.country'] = { $in: filters.country };
    if (filters.course?.length) leadQuery['profile.course'] = { $in: filters.course };
    if (filters.intake?.length) leadQuery['profile.intake'] = { $in: filters.intake };
    if (filters.university?.length) leadQuery['profile.university'] = { $in: filters.university };

    const leads = await Lead.find(leadQuery).select('phone name _id').lean();
    const phones = [...new Set(leads.map((l) => l.phone).filter(Boolean))];

    const contacts = await WhatsAppContact.find({
      company: companyId,
      phone: { $in: phones },
    }).lean();

    return leads.map((lead) => ({
      leadId: lead._id,
      phone: lead.phone,
      name: lead.name,
      contact: contacts.find((c) => c.phone === lead.phone),
    }));
  }

  /**
   * Create and optionally schedule a broadcast.
   * @param {string} companyId
   * @param {object} data
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async create(companyId, data, userId) {
    const recipients = await this.resolveRecipients(companyId, data.filters);
    const broadcast = await WhatsAppBroadcast.create({
      ...data,
      company: companyId,
      createdBy: userId,
      recipientCount: recipients.length,
      status: data.scheduledAt ? 'scheduled' : 'draft',
    });

    if (data.sendNow) {
      await this.enqueue(broadcast._id.toString(), companyId, recipients);
      broadcast.status = 'processing';
      broadcast.startedAt = new Date();
      await broadcast.save();
    }

    return broadcast;
  }

  /**
   * @param {string} broadcastId
   * @param {string} companyId
   * @param {Array} recipients
   */
  async enqueue(broadcastId, companyId, recipients) {
    for (const recipient of recipients) {
      await addBroadcastJob({ broadcastId, companyId, recipient });
    }
  }

  /**
   * @param {string} companyId
   * @param {object} options
   * @returns {Promise<{items: Array, total: number}>}
   */
  async list(companyId, { page = 1, limit = 20, status } = {}) {
    const query = { company: companyId };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WhatsAppBroadcast.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('template', 'name'),
      WhatsAppBroadcast.countDocuments(query),
    ]);
    return { items, total };
  }
}

module.exports = new BroadcastService();
