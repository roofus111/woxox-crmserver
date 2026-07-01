const EmailClick = require('../models/EmailClick');
const EmailMessage = require('../models/Email');

/**
 * Build click heatmap data from tracked link clicks.
 * Maps link URLs to click counts and estimated vertical zones in the email.
 */
async function getEmailHeatmap(companyId, emailId) {
  const email = await EmailMessage.findOne({ _id: emailId, company: companyId });
  if (!email) throw new Error('Email not found');

  const clicks = await EmailClick.find({ email: emailId }).sort({ clickedAt: -1 });
  const html = email.htmlContent || '';

  const linkMatches = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  let index = 0;
  while ((match = linkRegex.exec(html)) !== null) {
    linkMatches.push({
      index,
      url: match[1],
      text: match[2].replace(/<[^>]+>/g, '').trim(),
      position: Math.round((match.index / Math.max(html.length, 1)) * 100),
    });
    index += 1;
  }

  const urlStats = {};
  clicks.forEach((click) => {
    const key = click.url;
    if (!urlStats[key]) {
      urlStats[key] = { url: key, clicks: 0, linkId: click.linkId, zones: {} };
    }
    urlStats[key].clicks += 1;
    const zone = click.heatmapZone || 'unknown';
    urlStats[key].zones[zone] = (urlStats[key].zones[zone] || 0) + 1;
  });

  const heatmapZones = ['top', 'middle', 'bottom'];
  const zoneCounts = { top: 0, middle: 0, bottom: 0 };

  linkMatches.forEach((link) => {
    const stats = urlStats[link.url] || { clicks: 0 };
    link.clicks = stats.clicks;
    link.heat = stats.clicks > 0 ? Math.min(100, stats.clicks * 20) : 0;
    if (link.position < 33) zoneCounts.top += stats.clicks;
    else if (link.position < 66) zoneCounts.middle += stats.clicks;
    else zoneCounts.bottom += stats.clicks;
  });

  return {
    email: { _id: email._id, subject: email.subject },
    totalClicks: clicks.length,
    links: linkMatches,
    zoneCounts,
    heatmapZones,
    clickTimeline: clicks.slice(0, 50).map((c) => ({ url: c.url, clickedAt: c.clickedAt, device: c.device })),
  };
}

async function getCampaignHeatmap(companyId, campaignId) {
  const emails = await EmailMessage.find({ company: companyId, campaign: campaignId }).select('_id');
  const emailIds = emails.map((e) => e._id);

  const aggregation = await EmailClick.aggregate([
    { $match: { email: { $in: emailIds } } },
    { $group: { _id: '$url', clicks: { $sum: 1 }, devices: { $push: '$device' } } },
    { $sort: { clicks: -1 } },
    { $limit: 20 },
  ]);

  const zoneAgg = await EmailClick.aggregate([
    { $match: { email: { $in: emailIds }, heatmapZone: { $exists: true } } },
    { $group: { _id: '$heatmapZone', clicks: { $sum: 1 } } },
  ]);

  return {
    campaignId,
    linkStats: aggregation,
    zoneStats: zoneAgg,
    totalClicks: aggregation.reduce((s, l) => s + l.clicks, 0),
  };
}

function inferHeatmapZone(html, url) {
  const idx = html.indexOf(url);
  if (idx < 0) return 'middle';
  const ratio = idx / Math.max(html.length, 1);
  if (ratio < 0.33) return 'top';
  if (ratio < 0.66) return 'middle';
  return 'bottom';
}

module.exports = { getEmailHeatmap, getCampaignHeatmap, inferHeatmapZone };
