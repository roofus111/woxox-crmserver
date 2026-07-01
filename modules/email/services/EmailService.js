const EmailMessage = require('../models/Email');
const EmailDraft = require('../models/EmailDraft');
const EmailEvent = require('../models/EmailEvent');
const SmtpService = require('./SmtpService');
const TemplateService = require('./TemplateService');

async function listEmails(companyId, { folder = 'sent', page = 1, limit = 20, search, status, isRead } = {}) {
  const query = { company: companyId, folder };
  if (status) query.status = status;
  if (isRead !== undefined) query.isRead = isRead;
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('lead', 'name email status'),
    EmailMessage.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function getEmail(companyId, id) {
  return EmailMessage.findOne({ _id: id, company: companyId })
    .populate('lead', 'name email phone status profile')
    .populate('attachments')
    .populate('createdBy', 'name email');
}

async function getThread(companyId, threadId) {
  return EmailMessage.find({ company: companyId, threadId }).sort({ createdAt: 1 });
}

async function composeAndSend(companyId, userId, data) {
  const email = await SmtpService.sendEmail(companyId, {
    to: data.to,
    cc: data.cc,
    bcc: data.bcc,
    fromName: data.fromName,
    fromEmail: data.fromEmail,
    replyTo: data.replyTo,
    subject: data.subject,
    htmlContent: data.htmlContent,
    textContent: data.textContent,
    leadId: data.leadId,
    smtpAccount: data.smtpAccountId,
  }, { userId, user: { name: data.fromName } });

  await TemplateService.logAction(companyId, userId, 'send', 'email', email._id);
  return email;
}

async function saveDraft(companyId, userId, data) {
  if (data._id) {
    return EmailDraft.findOneAndUpdate(
      { _id: data._id, company: companyId, createdBy: userId },
      { ...data, lastAutosavedAt: new Date(), $inc: { autosaveVersion: 1 } },
      { new: true }
    );
  }
  return EmailDraft.create({ ...data, company: companyId, createdBy: userId, lastAutosavedAt: new Date() });
}

async function listDrafts(companyId, userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const query = { company: companyId, createdBy: userId };
  const [items, total] = await Promise.all([
    EmailDraft.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    EmailDraft.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function updateEmailFlags(companyId, id, flags) {
  return EmailMessage.findOneAndUpdate({ _id: id, company: companyId }, flags, { new: true });
}

async function getDraft(companyId, userId, id) {
  return EmailDraft.findOne({ _id: id, company: companyId, createdBy: userId });
}

async function deleteDraft(companyId, userId, id) {
  const draft = await EmailDraft.findOneAndDelete({ _id: id, company: companyId, createdBy: userId });
  if (!draft) throw new Error('Draft not found');
  return { deleted: true };
}

async function deleteEmail(companyId, id, { permanent = false } = {}) {
  const email = await EmailMessage.findOne({ _id: id, company: companyId });
  if (!email) throw new Error('Email not found');

  if (permanent || email.folder === 'trash') {
    await EmailMessage.findOneAndDelete({ _id: id, company: companyId });
    return { deleted: true };
  }

  email.folder = 'trash';
  await email.save();
  return email;
}

async function getLeadTimeline(companyId, leadId) {
  const [emails, events] = await Promise.all([
    EmailMessage.find({ company: companyId, lead: leadId }).sort({ createdAt: -1 }).limit(50),
    EmailEvent.find({ company: companyId, lead: leadId }).sort({ createdAt: -1 }).limit(50),
  ]);
  return { emails, events };
}

async function sendTestEmail(companyId, userId, data) {
  return SmtpService.sendEmail(companyId, {
    to: [{ email: data.testEmail, name: 'Test Recipient' }],
    subject: `[TEST] ${data.subject}`,
    htmlContent: data.htmlContent,
    fromName: data.fromName,
    fromEmail: data.fromEmail,
    smtpAccount: data.smtpAccountId,
  }, { userId, trackOpens: false, trackClicks: false });
}

module.exports = {
  listEmails, getEmail, getThread, composeAndSend, saveDraft, listDrafts,
  getDraft, deleteDraft, updateEmailFlags, deleteEmail, getLeadTimeline, sendTestEmail,
};
