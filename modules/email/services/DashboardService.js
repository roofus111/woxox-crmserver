const EmailMessage = require('../models/Email');
const EmailCampaign = require('../models/EmailCampaign');
const EmailDraft = require('../models/EmailDraft');
const EmailEvent = require('../models/EmailEvent');
const EmailAnalytics = require('../models/EmailAnalytics');

async function getDashboardStats(companyId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    sentToday, delivered, opened, clicked, bounced, spam,
    scheduled, drafts, activeCampaigns, failed,
  ] = await Promise.all([
    EmailMessage.countDocuments({ company: companyId, sentAt: { $gte: today, $lt: tomorrow }, status: { $in: ['sent', 'delivered', 'opened', 'clicked'] } }),
    EmailMessage.countDocuments({ company: companyId, status: { $in: ['delivered', 'opened', 'clicked'] } }),
    EmailEvent.countDocuments({ company: companyId, type: 'opened', createdAt: { $gte: today, $lt: tomorrow } }),
    EmailEvent.countDocuments({ company: companyId, type: 'clicked', createdAt: { $gte: today, $lt: tomorrow } }),
    EmailEvent.countDocuments({ company: companyId, type: 'bounced', createdAt: { $gte: today, $lt: tomorrow } }),
    EmailEvent.countDocuments({ company: companyId, type: 'spam', createdAt: { $gte: today, $lt: tomorrow } }),
    EmailMessage.countDocuments({ company: companyId, status: 'scheduled' }),
    EmailDraft.countDocuments({ company: companyId }),
    EmailCampaign.countDocuments({ company: companyId, status: { $in: ['sending', 'scheduled'] } }),
    EmailMessage.countDocuments({ company: companyId, status: 'failed', createdAt: { $gte: today, $lt: tomorrow } }),
  ]);

  const totalSent = sentToday || 1;
  const cards = {
    emailsSentToday: sentToday,
    emailsDelivered: delivered,
    openRate: Math.round((opened / totalSent) * 10000) / 100,
    clickRate: Math.round((clicked / totalSent) * 10000) / 100,
    bounceRate: Math.round((bounced / totalSent) * 10000) / 100,
    spamRate: Math.round((spam / totalSent) * 10000) / 100,
    scheduledEmails: scheduled,
    draftEmails: drafts,
    activeCampaigns,
    failedEmails: failed,
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailySending = await EmailAnalytics.find({ company: companyId, date: { $gte: thirtyDaysAgo } })
    .sort({ date: 1 })
    .select('date sent delivered opened clicked');

  const monthlySending = await EmailAnalytics.aggregate([
    { $match: { company: companyId } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, sent: { $sum: '$sent' }, delivered: { $sum: '$delivered' } } },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const [lastSent, failedEmails, recentlyOpened, campaignPerformance] = await Promise.all([
    EmailMessage.find({ company: companyId, folder: 'sent' }).sort({ sentAt: -1 }).limit(5).select('subject contactEmail sentAt status'),
    EmailMessage.find({ company: companyId, status: 'failed' }).sort({ createdAt: -1 }).limit(5).select('subject contactEmail errorMessage createdAt'),
    EmailEvent.find({ company: companyId, type: 'opened' }).sort({ createdAt: -1 }).limit(5).populate('email', 'subject contactEmail'),
    EmailCampaign.find({ company: companyId, status: { $in: ['completed', 'sending'] } }).sort({ updatedAt: -1 }).limit(5).select('name stats status'),
  ]);

  const deviceStats = await EmailEvent.aggregate([
    { $match: { company: companyId, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$device', count: { $sum: 1 } } },
  ]);

  const countryStats = await EmailEvent.aggregate([
    { $match: { company: companyId, country: { $exists: true, $ne: null }, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    cards,
    charts: {
      dailySending,
      monthlySending,
      deviceStats,
      countryStats,
    },
    recentActivity: { lastSent, failedEmails, recentlyOpened, campaignPerformance },
  };
}

module.exports = { getDashboardStats };
