const Lead = require('../../../models/Lead');
const Customer = require('../../../models/Customer');
const User = require('../../../models/User');
const LeadActivity = require('../../../models/LeadActivity');
const WhatsAppContact = require('../models/WhatsAppContact');
const WhatsAppActivityLog = require('../models/WhatsAppActivityLog');
const SettingsService = require('./SettingsService');
const { normalizePhone } = require('../utils/phone');

/**
 * Auto lead creation from incoming WhatsApp messages.
 */
class LeadCreationService {
  /**
   * Find or create lead from WhatsApp contact.
   * @param {object} params
   * @param {string} params.companyId
   * @param {string} params.phone
   * @param {string} [params.contactName]
   * @param {object} [params.settings]
   * @returns {Promise<{lead: object, contact: object, isNew: boolean}>}
   */
  async findOrCreateFromWhatsApp({ companyId, phone, contactName = '', settings = null }) {
    const normalizedPhone = normalizePhone(phone, settings?.defaultCountryCode || '91');

    let contact = await WhatsAppContact.findOne({ company: companyId, phone: normalizedPhone });
    let lead = null;
    let isNew = false;

    if (contact?.lead) {
      lead = await Lead.findById(contact.lead);
    }

    if (!lead) {
      lead = await Lead.findOne({ company: companyId, phone: normalizedPhone }).sort({ createdAt: -1 });
    }

    if (!lead && settings?.autoLeadCreation !== false) {
      const result = await this.createLeadAndContact({
        companyId,
        phone: normalizedPhone,
        contactName,
        settings,
      });
      lead = result.lead;
      contact = result.contact;
      isNew = true;
    } else if (lead && !contact) {
      contact = await this.ensureContact(companyId, normalizedPhone, contactName, lead._id);
    } else if (lead && contact && !contact.lead) {
      contact.lead = lead._id;
      await contact.save();
    }

    return { lead, contact, isNew };
  }

  /**
   * @param {object} params
   * @returns {Promise<{lead: object, contact: object}>}
   */
  async createLeadAndContact({ companyId, phone, contactName, settings }) {
    const date = new Date();
    const nameSuffix = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const leadName = contactName || `Newlead-WA${nameSuffix}`;

    let assignedTo = null;
    if (settings?.autoAssignment) {
      assignedTo = await this.resolveAssignee(companyId, settings);
    }

    const lead = await Lead.create({
      name: leadName,
      phone,
      status: 'New',
      source: 'WhatsApp',
      company: companyId,
      assignedTo,
      untouched: true,
    });

    const customer = await Customer.create({
      company: companyId,
      firstName: contactName || leadName,
      phone,
      customerType: 'Prospect',
      status: 'Active',
      source: 'WhatsApp',
      lead: [lead._id],
      activityLog: [{
        action: 'created',
        details: 'Customer created from WhatsApp',
        performedAt: new Date(),
      }],
    });

    lead.Customer = customer._id;
    await lead.save();

    const contact = await WhatsAppContact.create({
      company: companyId,
      phone,
      waId: phone,
      name: contactName || leadName,
      lead: lead._id,
      customer: customer._id,
    });

    await LeadActivity.create({
      company: companyId,
      leadId: lead._id,
      action: 'created',
      details: 'Lead auto-created from WhatsApp message',
      ipAddress: '0.0.0.0',
      userAgent: 'WhatsApp-Webhook',
    });

    await WhatsAppActivityLog.create({
      company: companyId,
      lead: lead._id,
      action: 'lead_created',
      details: `Lead created from WhatsApp: ${phone}`,
    });

    return { lead, contact };
  }

  /**
   * @param {string} companyId
   * @param {string} phone
   * @param {string} name
   * @param {string} leadId
   * @returns {Promise<object>}
   */
  async ensureContact(companyId, phone, name, leadId) {
    return WhatsAppContact.findOneAndUpdate(
      { company: companyId, phone },
      {
        $setOnInsert: { company: companyId, phone, waId: phone },
        $set: { name, lead: leadId },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Resolve assignee via round-robin or default agent.
   * @param {string} companyId
   * @param {object} settings
   * @returns {Promise<string|null>}
   */
  async resolveAssignee(companyId, settings) {
    if (settings.assignmentMode === 'round_robin') {
      const agents = await User.find({
        company: companyId,
        role: { $in: ['user', 'manager'] },
        isActive: { $ne: false },
      }).select('_id').lean();

      if (agents.length === 0) return settings.defaultAgent || null;

      const index = (settings.roundRobinIndex || 0) % agents.length;
      const assignee = agents[index]._id;

      await require('../models/WhatsAppSettings').findOneAndUpdate(
        { company: companyId },
        { roundRobinIndex: index + 1 }
      );

      return assignee;
    }

    return settings.defaultAgent || null;
  }
}

module.exports = new LeadCreationService();
