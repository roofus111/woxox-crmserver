const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppChatAssignment = require('../models/WhatsAppChatAssignment');
const WhatsAppActivityLog = require('../models/WhatsAppActivityLog');
const LeadActivity = require('../../../models/LeadActivity');

/**
 * Conversation management service.
 */
class ConversationService {
  /**
   * Get or create conversation for a contact.
   * @param {string} companyId
   * @param {string} contactId
   * @param {string} [leadId]
   * @returns {Promise<object>}
   */
  async getOrCreate(companyId, contactId, leadId = null) {
    let conversation = await WhatsAppConversation.findOne({
      company: companyId,
      contact: contactId,
      status: { $ne: 'archived' },
    }).sort({ updatedAt: -1 });

    if (!conversation) {
      conversation = await WhatsAppConversation.create({
        company: companyId,
        contact: contactId,
        lead: leadId,
        status: 'open',
      });
    } else if (leadId && !conversation.lead) {
      conversation.lead = leadId;
      await conversation.save();
    }

    return conversation;
  }

  /**
   * List conversations with filters and pagination.
   * @param {object} filters
   * @returns {Promise<{items: Array, total: number}>}
   */
  async list(filters) {
    const {
      companyId, page = 1, limit = 25, status, assignedTo,
      search, filter = 'all', userId, userRole,
    } = filters;

    const query = { company: companyId };

    if (status) query.status = status;
    if (filter === 'assigned' && userId) query.assignedTo = userId;
    if (filter === 'unassigned') query.assignedTo = null;
    if (filter === 'closed') query.status = 'closed';
    if (filter === 'archived') query.status = 'archived';
    if (filter === 'new') query.unreadCount = { $gt: 0 };
    if (assignedTo) query.assignedTo = assignedTo;
    if (userRole === 'user') query.assignedTo = userId;

    const skip = (page - 1) * limit;

    let contactIds = null;
    if (search) {
      const WhatsAppContact = require('../models/WhatsAppContact');
      const contacts = await WhatsAppContact.find({
        company: companyId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      contactIds = contacts.map((c) => c._id);
      query.contact = { $in: contactIds };
    }

    const [items, total] = await Promise.all([
      WhatsAppConversation.find(query)
        .populate('contact', 'name phone profilePicture')
        .populate('assignedTo', 'firstName lastName email profilePicture')
        .populate('lead', 'name status phone email')
        .sort({ isPinned: -1, lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WhatsAppConversation.countDocuments(query),
    ]);

    return { items, total };
  }

  /**
   * Assign conversation to user.
   * @param {object} params
   * @returns {Promise<object>}
   */
  async assign({ conversationId, companyId, assignedTo, assignedBy, type = 'manual', notes = '' }) {
    const conversation = await WhatsAppConversation.findOne({
      _id: conversationId,
      company: companyId,
    });

    if (!conversation) throw new Error('Conversation not found');

    const previousAssignee = conversation.assignedTo;

    await WhatsAppChatAssignment.updateMany(
      { conversation: conversationId, isActive: true },
      { isActive: false }
    );

    await WhatsAppChatAssignment.create({
      company: companyId,
      conversation: conversationId,
      assignedTo,
      assignedBy,
      assignmentType: type,
      previousAssignee,
      notes,
      isActive: true,
    });

    conversation.assignedTo = assignedTo;
    conversation.status = conversation.status === 'closed' ? 'open' : conversation.status;
    await conversation.save();

    if (conversation.lead) {
      await LeadActivity.create({
        company: companyId,
        leadId: conversation.lead,
        userId: assignedBy,
        action: 'assigned',
        details: `WhatsApp conversation assigned via ${type}`,
        ipAddress: '0.0.0.0',
      });

      await WhatsAppActivityLog.create({
        company: companyId,
        lead: conversation.lead,
        conversation: conversationId,
        user: assignedBy,
        action: 'conversation_assigned',
        details: notes || `Assigned to user ${assignedTo}`,
      });
    }

    return conversation.populate([
      { path: 'contact', select: 'name phone' },
      { path: 'assignedTo', select: 'firstName lastName' },
    ]);
  }

  /**
   * Update conversation status.
   * @param {string} conversationId
   * @param {string} companyId
   * @param {string} status
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async updateStatus(conversationId, companyId, status, userId) {
    const update = { status };
    if (status === 'closed') {
      update.closedAt = new Date();
      update.closedBy = userId;
    }
    return WhatsAppConversation.findOneAndUpdate(
      { _id: conversationId, company: companyId },
      update,
      { new: true }
    );
  }

  /**
   * Pin/unpin conversation.
   * @param {string} conversationId
   * @param {string} companyId
   * @param {boolean} isPinned
   * @returns {Promise<object>}
   */
  async togglePin(conversationId, companyId, isPinned) {
    return WhatsAppConversation.findOneAndUpdate(
      { _id: conversationId, company: companyId },
      { isPinned },
      { new: true }
    );
  }
}

module.exports = new ConversationService();
