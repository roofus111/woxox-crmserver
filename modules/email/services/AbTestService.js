const EmailCampaign = require('../models/EmailCampaign');
const EmailMessage = require('../models/Email');
const EmailOpen = require('../models/EmailOpen');
const EmailClick = require('../models/EmailClick');
const { addCampaignJob } = require('../queues/index');
const CampaignService = require('./CampaignService');

const DEFAULT_TEST_PERCENT = 20;
const MIN_TEST_SIZE = 10;

function initVariantStats(campaign) {
  if (!campaign.abTest?.enabled) return;
  const variants = campaign.abTest.variants || [];
  if (!campaign.abTest.variantStats?.length) {
    campaign.abTest.variantStats = variants.map(() => ({ sent: 0, opened: 0, clicked: 0 }));
  }
  if (!campaign.abTest.phase) campaign.abTest.phase = 'testing';
  if (!campaign.abTest.testSamplePercent) campaign.abTest.testSamplePercent = DEFAULT_TEST_PERCENT;
}

function pickVariantForRecipient(index, variants) {
  const total = variants.reduce((s, v) => s + (v.percentage || 0), 0) || 100;
  let cumulative = 0;
  const rand = (index * 17 + 7) % total;
  for (let i = 0; i < variants.length; i++) {
    cumulative += variants[i].percentage || Math.floor(100 / variants.length);
    if (rand < cumulative) return i;
  }
  return 0;
}

async function launchAbTestCampaign(companyId, userId, campaign) {
  initVariantStats(campaign);
  const recipients = await CampaignService.resolveRecipients(companyId, campaign.listIds, campaign.segmentIds);
  if (recipients.length === 0) throw new Error('No recipients found');

  const variants = campaign.abTest.variants?.length >= 2
    ? campaign.abTest.variants
    : [{ subject: campaign.subject, htmlContent: campaign.htmlContent, percentage: 50 }, { subject: `${campaign.subject} (B)`, htmlContent: campaign.htmlContent, percentage: 50 }];

  campaign.abTest.variants = variants;
  const testCount = Math.max(MIN_TEST_SIZE, Math.ceil(recipients.length * (campaign.abTest.testSamplePercent / 100)));
  const testRecipients = recipients.slice(0, testCount);
  const holdbackRecipients = recipients.slice(testCount);

  campaign.abTest.holdbackRecipients = holdbackRecipients.map((r) => r.email);
  campaign.abTest.testStartedAt = new Date();
  campaign.status = 'sending';
  campaign.startedAt = new Date();
  await campaign.save();

  for (let i = 0; i < testRecipients.length; i++) {
    const recipient = testRecipients[i];
    const variantIndex = pickVariantForRecipient(i, variants);
    const variant = variants[variantIndex];

    const email = await EmailMessage.create({
      company: companyId,
      campaign: campaign._id,
      direction: 'outbound',
      to: [{ email: recipient.email, name: recipient.name }],
      from: { email: campaign.fromEmail, name: campaign.fromName },
      subject: variant.subject || campaign.subject,
      htmlContent: variant.htmlContent || campaign.htmlContent,
      lead: recipient.leadId,
      contactEmail: recipient.email,
      status: 'queued',
      folder: 'sent',
      smtpAccount: campaign.smtpAccount,
      createdBy: userId,
      metadata: { abVariantIndex: variantIndex, abPhase: 'testing' },
    });

    campaign.abTest.variantStats[variantIndex].sent += 1;
    await addCampaignJob({
      emailId: email._id.toString(),
      companyId: companyId.toString(),
      campaignId: campaign._id.toString(),
      userId: userId.toString(),
      variantIndex,
    });
  }

  await campaign.save();
  return { campaign, testCount, holdbackCount: holdbackRecipients.length };
}

async function evaluateWinner(companyId, campaignId) {
  const campaign = await EmailCampaign.findOne({ _id: campaignId, company: companyId });
  if (!campaign?.abTest?.enabled) throw new Error('Not an A/B test campaign');
  if (campaign.abTest.phase === 'winner_sent') throw new Error('Winner already sent');

  initVariantStats(campaign);
  const criteria = campaign.abTest.winnerCriteria || 'open_rate';
  let winnerIndex = 0;
  let bestRate = -1;

  campaign.abTest.variantStats.forEach((stats, i) => {
    const denominator = stats.sent || 1;
    const rate = criteria === 'click_rate'
      ? stats.clicked / denominator
      : stats.opened / denominator;
    if (rate > bestRate) { bestRate = rate; winnerIndex = i; }
  });

  campaign.abTest.winnerVariantIndex = winnerIndex;
  campaign.abTest.winnerSelectedAt = new Date();
  campaign.abTest.phase = 'winner_sent';

  const winner = campaign.abTest.variants[winnerIndex];
  campaign.subject = winner.subject || campaign.subject;
  campaign.htmlContent = winner.htmlContent || campaign.htmlContent;

  const holdbackEmails = campaign.abTest.holdbackRecipients || [];
  const allRecipients = await CampaignService.resolveRecipients(companyId, campaign.listIds, campaign.segmentIds);
  const holdback = allRecipients.filter((r) => holdbackEmails.includes(r.email));

  let sent = 0;
  for (const recipient of holdback) {
    const email = await EmailMessage.create({
      company: companyId,
      campaign: campaign._id,
      direction: 'outbound',
      to: [{ email: recipient.email, name: recipient.name }],
      from: { email: campaign.fromEmail, name: campaign.fromName },
      subject: winner.subject || campaign.subject,
      htmlContent: winner.htmlContent || campaign.htmlContent,
      lead: recipient.leadId,
      contactEmail: recipient.email,
      status: 'queued',
      folder: 'sent',
      smtpAccount: campaign.smtpAccount,
      metadata: { abVariantIndex: winnerIndex, abPhase: 'winner' },
    });

    await addCampaignJob({
      emailId: email._id.toString(),
      companyId: companyId.toString(),
      campaignId: campaign._id.toString(),
    });
    sent += 1;
  }

  campaign.status = 'completed';
  campaign.completedAt = new Date();
  await campaign.save();

  return { winnerIndex, winner, holdbackSent: sent, rates: campaign.abTest.variantStats };
}

async function recordVariantEvent(campaignId, variantIndex, eventType) {
  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign?.abTest?.enabled || variantIndex == null) return;

  initVariantStats(campaign);
  if (!campaign.abTest.variantStats[variantIndex]) return;

  if (eventType === 'opened') campaign.abTest.variantStats[variantIndex].opened += 1;
  if (eventType === 'clicked') campaign.abTest.variantStats[variantIndex].clicked += 1;

  campaign.markModified('abTest');
  await campaign.save();

  const testStarted = campaign.abTest.testStartedAt;
  const hoursElapsed = testStarted ? (Date.now() - new Date(testStarted).getTime()) / 3600000 : 0;
  const minHours = campaign.abTest.testDurationHours || 4;

  if (campaign.abTest.phase === 'testing' && hoursElapsed >= minHours) {
    const totalTestSent = campaign.abTest.variantStats.reduce((s, v) => s + v.sent, 0);
    const totalOpens = campaign.abTest.variantStats.reduce((s, v) => s + v.opened, 0);
    if (totalTestSent >= MIN_TEST_SIZE && totalOpens >= Math.ceil(totalTestSent * 0.1)) {
      await evaluateWinner(campaign.company, campaignId).catch(() => {});
    }
  }
}

module.exports = { launchAbTestCampaign, evaluateWinner, recordVariantEvent, pickVariantForRecipient };
