const EmailMessage = require('../models/Email');
const EmailOpen = require('../models/EmailOpen');
const EmailClick = require('../models/EmailClick');
const EmailEvent = require('../models/EmailEvent');
const EmailAnalytics = require('../models/EmailAnalytics');
const EmailCampaign = require('../models/EmailCampaign');
const LeadActivityService = require('./LeadActivityService');
const AbTestService = require('./AbTestService');
const HeatmapService = require('./HeatmapService');

function parseDevice(userAgent = '') {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (userAgent) return 'desktop';
  return 'unknown';
}

function parseBrowser(userAgent = '') {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Other';
}

async function recordOpen(trackingId, req) {
  const email = await EmailMessage.findOne({ trackingId });
  if (!email) return null;

  const device = parseDevice(req.headers['user-agent']);
  await EmailOpen.create({
    company: email.company,
    email: email._id,
    campaign: email.campaign,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    device,
  });

  await EmailEvent.create({
    company: email.company,
    email: email._id,
    campaign: email.campaign,
    lead: email.lead,
    type: 'opened',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    device,
    browser: parseBrowser(req.headers['user-agent']),
  });

  if (email.status !== 'opened' && email.status !== 'clicked') {
    email.status = 'opened';
    email.openedAt = new Date();
    await email.save();
  }

  if (email.campaign) {
    await EmailCampaign.findByIdAndUpdate(email.campaign, { $inc: { 'stats.opened': 1 } });
    const variantIndex = email.metadata?.abVariantIndex;
    if (variantIndex != null) {
      await AbTestService.recordVariantEvent(email.campaign, variantIndex, 'opened');
    }
  }

  await incrementDailyAnalytics(email.company, email.campaign, 'opened');
  await LeadActivityService.logFromEmail(email, 'opened', `Opened: ${email.subject}`, req);

  return email;
}

async function recordClick(trackingId, linkId, url, req) {
  const email = await EmailMessage.findOne({ trackingId });
  if (!email) return null;

  const decodedUrl = decodeURIComponent(url);
  const heatmapZone = HeatmapService.inferHeatmapZone(email.htmlContent || '', decodedUrl);

  await EmailClick.create({
    company: email.company,
    email: email._id,
    campaign: email.campaign,
    url: decodedUrl,
    linkId,
    heatmapZone,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    device: parseDevice(req.headers['user-agent']),
  });

  await EmailEvent.create({
    company: email.company,
    email: email._id,
    campaign: email.campaign,
    lead: email.lead,
    type: 'clicked',
    metadata: { url: decodedUrl, linkId, heatmapZone },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    device: parseDevice(req.headers['user-agent']),
  });

  email.status = 'clicked';
  email.clickedAt = new Date();
  await email.save();

  if (email.campaign) {
    await EmailCampaign.findByIdAndUpdate(email.campaign, { $inc: { 'stats.clicked': 1 } });
    const variantIndex = email.metadata?.abVariantIndex;
    if (variantIndex != null) {
      await AbTestService.recordVariantEvent(email.campaign, variantIndex, 'clicked');
    }
  }

  await incrementDailyAnalytics(email.company, email.campaign, 'clicked');
  await LeadActivityService.logFromEmail(email, 'clicked', `Clicked: ${decodedUrl}`, req);

  return { redirectUrl: decodedUrl };
}

async function incrementDailyAnalytics(companyId, campaignId, field) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const update = { $inc: { [field]: 1 } };
  await EmailAnalytics.findOneAndUpdate(
    { company: companyId, campaign: campaignId || null, date: today },
    update,
    { upsert: true, new: true }
  );
}

async function getCampaignAnalytics(companyId, campaignId) {
  const campaign = await EmailCampaign.findOne({ _id: campaignId, company: companyId });
  if (!campaign) throw new Error('Campaign not found');

  const [opens, clicks, events, linkStats, heatmap] = await Promise.all([
    EmailOpen.find({ campaign: campaignId }).sort({ openedAt: -1 }).limit(100),
    EmailClick.find({ campaign: campaignId }).sort({ clickedAt: -1 }).limit(100),
    EmailEvent.find({ campaign: campaignId }).sort({ createdAt: -1 }).limit(200),
    EmailClick.aggregate([
      { $match: { campaign: campaignId } },
      { $group: { _id: '$url', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
    ]),
    HeatmapService.getCampaignHeatmap(companyId, campaignId),
  ]);

  return { campaign, opens, clicks, events, linkStats, heatmap };
}

async function getAnalyticsOverview(companyId, { from, to } = {}) {
  const match = { company: companyId };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const summary = await EmailAnalytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        sent: { $sum: '$sent' },
        delivered: { $sum: '$delivered' },
        opened: { $sum: '$opened' },
        clicked: { $sum: '$clicked' },
        bounced: { $sum: '$bounced' },
        spam: { $sum: '$spam' },
        unsubscribed: { $sum: '$unsubscribed' },
      },
    },
  ]);

  return summary[0] || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, spam: 0, unsubscribed: 0 };
}

module.exports = { recordOpen, recordClick, getCampaignAnalytics, getAnalyticsOverview };
