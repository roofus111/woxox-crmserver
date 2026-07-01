const EmailCampaign = require('../models/EmailCampaign');
const EmailMessage = require('../models/Email');
const EmailContactList = require('../models/ContactList');
const EmailSegment = require('../models/Segment');
const Lead = require('../../../models/Lead');
const SmtpService = require('./SmtpService');
const TemplateService = require('./TemplateService');
const AbTestService = require('./AbTestService');
const LeadActivityService = require('./LeadActivityService');
const { addCampaignJob } = require('../queues/index');

async function listCampaigns(companyId, { page = 1, limit = 20, status, type, search } = {}) {
  const query = { company: companyId };
  if (status) query.status = status;
  if (type) query.type = type;
  if (search) query.name = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailCampaign.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    EmailCampaign.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function getCampaign(companyId, id) {
  return EmailCampaign.findOne({ _id: id, company: companyId })
    .populate('listIds', 'name contactCount')
    .populate('segmentIds', 'name estimatedCount')
    .populate('template', 'name subject htmlContent');
}

async function createCampaign(companyId, userId, data) {
  return EmailCampaign.create({
    company: companyId,
    name: data.name,
    type: data.type || 'regular',
    subject: data.subject,
    preheader: data.preheader,
    fromName: data.fromName,
    fromEmail: data.fromEmail,
    replyTo: data.replyTo,
    htmlContent: data.htmlContent,
    template: data.templateId,
    listIds: data.listIds || [],
    segmentIds: data.segmentIds || [],
    smtpAccount: data.smtpAccountId,
    schedule: data.schedule,
    tracking: data.tracking,
    abTest: data.abTest,
    createdBy: userId,
  });
}

async function resolveRecipients(companyId, listIds = [], segmentIds = []) {
  const recipients = new Map();

  for (const listId of listIds) {
    const list = await EmailContactList.findOne({ _id: listId, company: companyId });
    if (!list) continue;
    if (list.type === 'static') {
      list.contacts.filter((c) => c.status === 'active').forEach((c) => {
        recipients.set(c.email.toLowerCase(), { email: c.email, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), leadId: c.lead });
      });
    } else {
      const leads = await buildDynamicListLeads(companyId, list.dynamicRules);
      leads.forEach((lead) => {
        if (lead.email) recipients.set(lead.email.toLowerCase(), { email: lead.email, name: lead.name, leadId: lead._id });
      });
    }
  }

  for (const segmentId of segmentIds) {
    const segment = await (require('../models/Segment')).findOne({ _id: segmentId, company: companyId });
    if (!segment) continue;
    const leads = await resolveSegmentLeads(companyId, segment.rules);
    leads.forEach((lead) => {
      if (lead.email) recipients.set(lead.email.toLowerCase(), { email: lead.email, name: lead.name, leadId: lead._id });
    });
  }

  return Array.from(recipients.values());
}

async function buildDynamicListLeads(companyId, rules) {
  const query = { company: companyId, email: { $exists: true, $ne: '' } };
  return Lead.find(query).limit(5000);
}

async function resolveSegmentLeads(companyId, rules = []) {
  const query = { company: companyId, email: { $exists: true, $ne: '' } };
  rules.forEach((rule) => {
    const fieldMap = {
      country: 'profile.country', state: 'profile.state', city: 'profile.city',
      leadStatus: 'status', university: 'profile.programOfInterest', course: 'profile.programOfInterest',
      intake: 'profile.targetIntake', leadSource: 'source', applicationStatus: 'status',
      visaStatus: 'profile.visaRefusal', assignedCounselor: 'assignedTo',
    };
    const field = fieldMap[rule.field] || rule.field;
    switch (rule.operator) {
      case 'equals': query[field] = rule.value; break;
      case 'contains': query[field] = { $regex: rule.value, $options: 'i' }; break;
      case 'in': query[field] = { $in: rule.value }; break;
      default: break;
    }
  });
  return Lead.find(query).limit(5000);
}

async function launchCampaign(companyId, userId, campaignId) {
  const campaign = await getCampaign(companyId, campaignId);
  if (!campaign) throw new Error('Campaign not found');
  if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) throw new Error(`Cannot launch campaign in ${campaign.status} status`);

  if (campaign.abTest?.enabled || campaign.type === 'ab_test') {
    campaign.abTest = campaign.abTest || { enabled: true };
    campaign.abTest.enabled = true;
    const result = await AbTestService.launchAbTestCampaign(companyId, userId, campaign);
    await TemplateService.logAction(companyId, userId, 'launch_ab_test', 'campaign', campaign._id, {
      testCount: result.testCount,
      holdbackCount: result.holdbackCount,
    });
    return { campaign: result.campaign, recipientCount: result.testCount, abTest: true };
  }

  const recipients = await resolveRecipients(companyId, campaign.listIds, campaign.segmentIds);
  if (recipients.length === 0) throw new Error('No recipients found');

  campaign.status = campaign.schedule?.sendAt && new Date(campaign.schedule.sendAt) > new Date() ? 'scheduled' : 'sending';
  campaign.startedAt = new Date();
  campaign.stats.sent = 0;
  await campaign.save();

  const delay = campaign.schedule?.sendAt ? Math.max(0, new Date(campaign.schedule.sendAt) - Date.now()) : 0;

  for (const recipient of recipients) {
    const email = await EmailMessage.create({
      company: companyId,
      campaign: campaign._id,
      direction: 'outbound',
      to: [{ email: recipient.email, name: recipient.name }],
      from: { email: campaign.fromEmail, name: campaign.fromName },
      replyTo: campaign.replyTo,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      lead: recipient.leadId,
      contactEmail: recipient.email,
      status: delay > 0 ? 'scheduled' : 'queued',
      folder: delay > 0 ? 'scheduled' : 'sent',
      scheduledAt: campaign.schedule?.sendAt,
      smtpAccount: campaign.smtpAccount,
      createdBy: userId,
    });

    await addCampaignJob({
      emailId: email._id.toString(),
      companyId: companyId.toString(),
      campaignId: campaign._id.toString(),
      userId: userId.toString(),
    }, delay);
  }

  await TemplateService.logAction(companyId, userId, 'launch', 'campaign', campaign._id, { recipients: recipients.length });
  return { campaign, recipientCount: recipients.length };
}

async function updateCampaignStatus(companyId, campaignId, status) {
  const campaign = await EmailCampaign.findOneAndUpdate(
    { _id: campaignId, company: companyId },
    { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) },
    { new: true }
  );
  return campaign;
}

async function updateCampaign(companyId, campaignId, data) {
  const campaign = await EmailCampaign.findOne({ _id: campaignId, company: companyId });
  if (!campaign) throw new Error('Campaign not found');
  if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
    throw new Error('Only draft, scheduled, or paused campaigns can be edited');
  }

  const fields = ['name', 'type', 'subject', 'preheader', 'fromName', 'fromEmail', 'replyTo', 'htmlContent', 'schedule', 'tracking', 'abTest'];
  fields.forEach((field) => {
    if (data[field] !== undefined) campaign[field] = data[field];
  });
  if (data.templateId !== undefined) campaign.template = data.templateId;
  if (data.listIds !== undefined) campaign.listIds = data.listIds;
  if (data.segmentIds !== undefined) campaign.segmentIds = data.segmentIds;
  if (data.smtpAccountId !== undefined) campaign.smtpAccount = data.smtpAccountId;

  await campaign.save();
  return campaign;
}

async function deleteCampaign(companyId, campaignId) {
  const campaign = await EmailCampaign.findOne({ _id: campaignId, company: companyId });
  if (!campaign) throw new Error('Campaign not found');
  if (['sending'].includes(campaign.status)) throw new Error('Cannot delete a campaign while it is sending');

  await EmailCampaign.findOneAndDelete({ _id: campaignId, company: companyId });
  return { deleted: true };
}

module.exports = {
  listCampaigns, getCampaign, createCampaign, launchCampaign,
  updateCampaignStatus, updateCampaign, deleteCampaign,
  resolveRecipients, resolveSegmentLeads,
};
