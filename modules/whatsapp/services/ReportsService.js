const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppBroadcast = require('../models/WhatsAppBroadcast');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppActivityLog = require('../models/WhatsAppActivityLog');

/**
 * WhatsApp analytics and reporting service.
 */
class ReportsService {
  /**
   * Get dashboard metrics for a date range.
   * @param {string} companyId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<object>}
   */
  async getDashboardMetrics(companyId, startDate, endDate) {
    const dateFilter = { company: companyId, createdAt: { $gte: startDate, $lte: endDate } };

    const [
      sent, received, delivered, read, failed,
      conversations, broadcasts, campaigns,
    ] = await Promise.all([
      WhatsAppMessage.countDocuments({ ...dateFilter, direction: 'outbound' }),
      WhatsAppMessage.countDocuments({ ...dateFilter, direction: 'inbound' }),
      WhatsAppMessage.countDocuments({ ...dateFilter, direction: 'outbound', status: { $in: ['delivered', 'read'] } }),
      WhatsAppMessage.countDocuments({ ...dateFilter, direction: 'outbound', status: 'read' }),
      WhatsAppMessage.countDocuments({ ...dateFilter, status: 'failed' }),
      WhatsAppConversation.countDocuments({ company: companyId }),
      WhatsAppBroadcast.countDocuments({ company: companyId }),
      WhatsAppCampaign.countDocuments({ company: companyId }),
    ]);

    return {
      messagesSent: sent,
      messagesReceived: received,
      delivered,
      read,
      failed,
      conversationCount: conversations,
      broadcastCount: broadcasts,
      campaignCount: campaigns,
      deliveryRate: sent ? Math.round((delivered / sent) * 100) : 0,
      readRate: sent ? Math.round((read / sent) * 100) : 0,
    };
  }

  /**
   * Get time-series chart data.
   * @param {string} companyId
   * @param {string} period - daily|weekly|monthly
   * @param {number} days
   * @returns {Promise<Array>}
   */
  async getChartData(companyId, period = 'daily', days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const format = period === 'monthly' ? '%Y-%m' : period === 'weekly' ? '%Y-W%V' : '%Y-%m-%d';

    return WhatsAppMessage.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format, date: '$createdAt' } },
            direction: '$direction',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);
  }

  /**
   * Agent performance report.
   * @param {string} companyId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async getAgentPerformance(companyId, startDate, endDate) {
    return WhatsAppMessage.aggregate([
      {
        $match: {
          company: companyId,
          direction: 'outbound',
          sentBy: { $exists: true },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$sentBy',
          messagesSent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentId: '$_id',
          agentName: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] },
          messagesSent: 1,
          delivered: 1,
          read: 1,
        },
      },
    ]);
  }
}

module.exports = new ReportsService();
