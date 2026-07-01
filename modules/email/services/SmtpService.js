const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const EmailSMTPAccount = require('../models/SMTPAccount');
const EmailSuppressionList = require('../models/SuppressionList');
const EmailMessage = require('../models/Email');
const EmailQueue = require('../models/EmailQueue');
const EmailEvent = require('../models/EmailEvent');
const { encrypt, decrypt, maskSecret } = require('../utils/encryption');
const { sanitizeEmailHtml } = require('../utils/sanitize');
const { renderMergeTags, buildLeadContext } = require('../utils/mergeTags');
const Lead = require('../../../models/Lead');
const Company = require('../../../models/Company');
const LeadActivityService = require('./LeadActivityService');
const SettingsService = require('./SettingsService');

const PROVIDER_DEFAULTS = {
  gmail_oauth: { host: 'smtp.gmail.com', port: 587, secure: false },
  office365: { host: 'smtp.office365.com', port: 587, secure: false },
  amazon_ses: { host: 'email-smtp.us-east-1.amazonaws.com', port: 587, secure: false },
  mailgun: { host: 'smtp.mailgun.org', port: 587, secure: false },
  sendgrid: { host: 'smtp.sendgrid.net', port: 587, secure: false },
  brevo: { host: 'smtp-relay.brevo.com', port: 587, secure: false },
  postmark: { host: 'smtp.postmarkapp.com', port: 587, secure: false },
};

async function getAccount(companyId, accountId) {
  const query = { company: companyId, isActive: true };
  if (accountId) query._id = accountId;
  else query.isDefault = true;
  let account = await EmailSMTPAccount.findOne(query);
  if (!account) account = await EmailSMTPAccount.findOne({ company: companyId, isActive: true }).sort({ priority: 1 });
  if (account) return account;

  return buildVirtualAccountFromSettings(companyId);
}

async function buildVirtualAccountFromSettings(companyId) {
  const creds = await SettingsService.getDecryptedCredentials(companyId);
  if (!creds) return null;

  if (creds.smtp?.host && creds.smtp?.username && creds.smtp?.password) {
    return {
      provider: 'smtp',
      host: creds.smtp.host,
      port: creds.smtp.port || 587,
      secure: creds.smtp.secure || false,
      username: creds.smtp.username,
      passwordEncrypted: encrypt(creds.smtp.password),
      fromEmail: creds.smtp.fromEmail || creds.smtp.username,
      fromName: creds.smtp.fromName || '',
      replyTo: creds.smtp.fromEmail,
      dailyLimit: 1000,
      sentToday: 0,
      isVirtual: true,
    };
  }

  if (creds.sendgrid?.apiKey) {
    return {
      provider: 'sendgrid',
      username: 'apikey',
      apiKeyEncrypted: encrypt(creds.sendgrid.apiKey),
      fromEmail: creds.smtp?.fromEmail || process.env.SMTP_USER,
      fromName: creds.smtp?.fromName || '',
      dailyLimit: 1000,
      sentToday: 0,
      isVirtual: true,
    };
  }

  if (creds.mailgun?.apiKey) {
    return {
      provider: 'mailgun',
      username: creds.mailgun.domain || 'mailgun',
      apiKeyEncrypted: encrypt(creds.mailgun.apiKey),
      fromEmail: creds.smtp?.fromEmail,
      fromName: creds.smtp?.fromName || '',
      dailyLimit: 1000,
      sentToday: 0,
      isVirtual: true,
    };
  }

  return null;
}

function buildTransporter(account) {
  const defaults = PROVIDER_DEFAULTS[account.provider] || {};
  const config = {
    host: account.host || defaults.host || 'smtp.gmail.com',
    port: account.port || defaults.port || 587,
    secure: account.secure ?? defaults.secure ?? false,
    tls: { rejectUnauthorized: false },
  };

  if (['sendgrid', 'mailgun', 'brevo', 'postmark', 'amazon_ses'].includes(account.provider)) {
    const apiKey = decrypt(account.apiKeyEncrypted);
    config.auth = { user: account.username || account.fromEmail, pass: apiKey };
  } else if (account.provider === 'gmail_oauth') {
    config.auth = {
      type: 'OAuth2',
      user: account.fromEmail,
      clientId: account.oauthClientId,
      clientSecret: decrypt(account.oauthClientSecretEncrypted),
      refreshToken: decrypt(account.oauthRefreshTokenEncrypted),
    };
  } else {
    config.auth = {
      user: account.username || account.fromEmail,
      pass: decrypt(account.passwordEncrypted),
    };
  }

  return nodemailer.createTransport(config);
}

async function testConnection(accountData) {
  let account = accountData;
  if (accountData._id) {
    account = await EmailSMTPAccount.findById(accountData._id);
  }
  const transporter = buildTransporter(account);
  await transporter.verify();
  if (account._id) {
    account.lastTestedAt = new Date();
    account.lastTestStatus = 'success';
    await account.save();
  }
  return { success: true };
}

async function createAccount(companyId, userId, data) {
  const payload = {
    company: companyId,
    name: data.name,
    provider: data.provider || 'smtp',
    fromEmail: data.fromEmail,
    fromName: data.fromName,
    replyTo: data.replyTo,
    host: data.host,
    port: data.port,
    secure: data.secure,
    username: data.username,
    oauthClientId: data.oauthClientId,
    region: data.region,
    domain: data.domain,
    isDefault: data.isDefault || false,
    isFallback: data.isFallback || false,
    priority: data.priority || 10,
    dailyLimit: data.dailyLimit || 1000,
    createdBy: userId,
  };
  if (data.password) payload.passwordEncrypted = encrypt(data.password);
  if (data.apiKey) payload.apiKeyEncrypted = encrypt(data.apiKey);
  else if (data.password && ['sendgrid', 'mailgun', 'brevo', 'postmark', 'amazon_ses'].includes(data.provider)) {
    payload.apiKeyEncrypted = encrypt(data.password);
  }
  if (data.oauthClientSecret) payload.oauthClientSecretEncrypted = encrypt(data.oauthClientSecret);
  if (data.oauthRefreshToken) payload.oauthRefreshTokenEncrypted = encrypt(data.oauthRefreshToken);

  if (payload.isDefault) {
    await EmailSMTPAccount.updateMany({ company: companyId }, { isDefault: false });
  }

  return EmailSMTPAccount.create(payload);
}

async function updateAccount(companyId, accountId, data) {
  const account = await EmailSMTPAccount.findOne({ _id: accountId, company: companyId });
  if (!account) throw new Error('Account not found');

  const fields = ['name', 'provider', 'fromEmail', 'fromName', 'replyTo', 'host', 'port', 'secure', 'username', 'oauthClientId', 'region', 'domain', 'isDefault', 'isFallback', 'priority', 'dailyLimit', 'isActive'];
  fields.forEach((field) => {
    if (data[field] !== undefined) account[field] = data[field];
  });

  if (data.password) account.passwordEncrypted = encrypt(data.password);
  if (data.apiKey) account.apiKeyEncrypted = encrypt(data.apiKey);
  else if (data.password && ['sendgrid', 'mailgun', 'brevo', 'postmark', 'amazon_ses'].includes(account.provider)) {
    account.apiKeyEncrypted = encrypt(data.password);
  }
  if (data.oauthClientSecret) account.oauthClientSecretEncrypted = encrypt(data.oauthClientSecret);
  if (data.oauthRefreshToken) account.oauthRefreshTokenEncrypted = encrypt(data.oauthRefreshToken);

  if (account.isDefault) {
    await EmailSMTPAccount.updateMany({ company: companyId, _id: { $ne: account._id } }, { isDefault: false });
  }

  await account.save();
  return account;
}

async function deleteAccount(companyId, accountId) {
  const account = await EmailSMTPAccount.findOne({ _id: accountId, company: companyId });
  if (!account) throw new Error('Account not found');
  account.isActive = false;
  if (account.isDefault) account.isDefault = false;
  await account.save();
  return { deleted: true };
}

function sanitizeAccountForResponse(account) {
  const obj = account.toObject ? account.toObject() : account;
  delete obj.passwordEncrypted;
  delete obj.apiKeyEncrypted;
  delete obj.oauthClientSecretEncrypted;
  delete obj.oauthRefreshTokenEncrypted;
  if (obj.username) obj.username = maskSecret(obj.username);
  return obj;
}

async function checkRateLimit(account) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!account.lastResetDate || account.lastResetDate < today) {
    account.sentToday = 0;
    account.lastResetDate = today;
    await account.save();
  }
  return account.sentToday < account.dailyLimit;
}

async function sendEmail(companyId, emailData, options = {}) {
  const suppressed = await EmailSuppressionList.findOne({ company: companyId, email: emailData.to?.[0]?.email?.toLowerCase() });
  if (suppressed) throw new Error('Recipient is on suppression list');

  const account = await getAccount(companyId, emailData.smtpAccount || options.smtpAccountId);
  if (!account) throw new Error('No SMTP account configured');

  const canSend = await checkRateLimit(account);
  if (!canSend) {
    const fallback = await EmailSMTPAccount.findOne({ company: companyId, isFallback: true, isActive: true });
    if (!fallback) throw new Error('Daily sending limit reached');
    return sendEmail(companyId, emailData, { ...options, smtpAccountId: fallback._id });
  }

  let lead = null;
  if (emailData.leadId) lead = await Lead.findById(emailData.leadId);
  const company = await Company.findById(companyId);
  const context = buildLeadContext(lead, company?.toObject?.() || {}, options.user || {});

  const subject = renderMergeTags(emailData.subject, context);
  let html = sanitizeEmailHtml(renderMergeTags(emailData.htmlContent || '', context));
  const trackingId = uuidv4();
  const apiBase = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:8000';

  if (options.trackOpens !== false) {
    html += `<img src="${apiBase}/api/email/track/open/${trackingId}" width="1" height="1" alt="" style="display:none" />`;
  }

  if (options.trackClicks !== false) {
    html = html.replace(/href="(https?:\/\/[^"]+)"/gi, (match, url) => {
      const linkId = uuidv4();
      return `href="${apiBase}/api/email/track/click/${trackingId}/${linkId}?url=${encodeURIComponent(url)}"`;
    });
  }

  const transporter = buildTransporter(account);
  const mailOptions = {
    from: `"${emailData.fromName || account.fromName || account.fromEmail}" <${emailData.fromEmail || account.fromEmail}>`,
    to: emailData.to.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', '),
    subject,
    html,
    text: emailData.textContent,
    replyTo: emailData.replyTo || account.replyTo,
  };

  if (emailData.cc?.length) mailOptions.cc = emailData.cc.map((r) => r.email).join(', ');
  if (emailData.bcc?.length) mailOptions.bcc = emailData.bcc.map((r) => r.email).join(', ');

  const info = await transporter.sendMail(mailOptions);

  account.sentToday += 1;
  if (!account.isVirtual) await account.save();

  let email;
  if (options.existingEmailId) {
    email = await EmailMessage.findByIdAndUpdate(options.existingEmailId, {
      messageId: info.messageId,
      trackingId,
      subject,
      htmlContent: html,
      status: 'sent',
      folder: 'sent',
      sentAt: new Date(),
      smtpAccount: account._id,
    }, { new: true });
  } else {
    email = await EmailMessage.create({
      company: companyId,
      campaign: emailData.campaignId,
      messageId: info.messageId,
      trackingId,
      direction: 'outbound',
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      from: { email: account.fromEmail, name: account.fromName },
      replyTo: mailOptions.replyTo,
      subject,
      htmlContent: html,
      textContent: emailData.textContent,
      lead: emailData.leadId,
      contactEmail: emailData.to?.[0]?.email,
      status: 'sent',
      folder: 'sent',
      sentAt: new Date(),
      smtpAccount: account._id,
      createdBy: options.userId,
    });
  }

  await EmailEvent.create({
    company: companyId,
    email: email._id,
    campaign: emailData.campaignId,
    lead: emailData.leadId,
    type: 'sent',
  });

  if (email.lead) {
    await LeadActivityService.logFromEmail(email, 'sent', `Sent: ${subject}`, { ip: '0.0.0.0' });
  }

  return email;
}

async function queueEmail(companyId, emailId, scheduledFor) {
  return EmailQueue.create({
    company: companyId,
    email: emailId,
    status: 'pending',
    scheduledFor: scheduledFor || new Date(),
  });
}

module.exports = {
  getAccount,
  buildTransporter,
  testConnection,
  createAccount,
  updateAccount,
  deleteAccount,
  sanitizeAccountForResponse,
  sendEmail,
  queueEmail,
  PROVIDER_DEFAULTS,
};
