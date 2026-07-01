const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const EmailMessage = require('../models/Email');
const EmailSMTPAccount = require('../models/SMTPAccount');
const Lead = require('../../../models/Lead');
const { decrypt } = require('../utils/encryption');
const { sanitizeEmailHtml } = require('../utils/sanitize');
const LeadActivityService = require('./LeadActivityService');
const { v4: uuidv4 } = require('uuid');

const IMAP_DEFAULTS = {
  gmail_oauth: { host: 'imap.gmail.com', port: 993, secure: true },
  office365: { host: 'outlook.office365.com', port: 993, secure: true },
  smtp: { host: 'imap.gmail.com', port: 993, secure: true },
};

function buildImapConfig(account) {
  const defaults = IMAP_DEFAULTS[account.provider] || {};
  const config = {
    host: account.imap?.host || defaults.host,
    port: account.imap?.port || defaults.port || 993,
    secure: account.imap?.secure ?? defaults.secure ?? true,
    auth: {},
  };

  if (account.provider === 'gmail_oauth') {
    config.auth = {
      user: account.fromEmail,
      accessToken: decrypt(account.oauthAccessTokenEncrypted || account.oauthRefreshTokenEncrypted),
    };
    config.authMethod = 'XOAUTH2';
  } else {
    config.auth = {
      user: account.imap?.username || account.username || account.fromEmail,
      pass: decrypt(account.imap?.passwordEncrypted || account.passwordEncrypted),
    };
  }

  return config;
}

async function findLeadByEmail(companyId, emailAddress) {
  if (!emailAddress) return null;
  return Lead.findOne({ company: companyId, email: { $regex: new RegExp(`^${emailAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
}

async function syncAccount(accountId, companyId) {
  const account = await EmailSMTPAccount.findOne({ _id: accountId, company: companyId, isActive: true });
  if (!account) throw new Error('SMTP/IMAP account not found');
  if (!account.imap?.enabled && !['gmail_oauth', 'office365'].includes(account.provider)) {
    throw new Error('IMAP sync is not enabled for this account');
  }

  const config = buildImapConfig(account);
  const client = new ImapFlow(config);
  let imported = 0;
  let skipped = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const since = account.imap?.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const lastUid = account.imap?.lastUid || 0;

      for await (const msg of client.fetch({ uid: `${lastUid + 1}:*` }, { envelope: true, source: true, uid: true })) {
        if (!msg.source) continue;

        const parsed = await simpleParser(msg.source);
        const fromEmail = parsed.from?.value?.[0]?.address;
        const messageId = parsed.messageId || `imap-${msg.uid}-${account._id}`;

        const existing = await EmailMessage.findOne({ company: companyId, messageId });
        if (existing) { skipped += 1; continue; }

        const lead = await findLeadByEmail(companyId, fromEmail);
        const threadId = parsed.inReplyTo || parsed.references?.[0] || messageId;

        const email = await EmailMessage.create({
          company: companyId,
          messageId,
          threadId,
          direction: 'inbound',
          to: [{ email: account.fromEmail, name: account.fromName }],
          from: { email: fromEmail, name: parsed.from?.value?.[0]?.name || fromEmail },
          subject: parsed.subject || '(No subject)',
          htmlContent: sanitizeEmailHtml(parsed.html || parsed.textAsHtml || ''),
          textContent: parsed.text,
          lead: lead?._id,
          contactEmail: fromEmail,
          status: 'delivered',
          folder: 'inbox',
          isRead: false,
          sentAt: parsed.date || new Date(),
          smtpAccount: account._id,
          trackingId: uuidv4(),
        });

        if (lead) {
          await LeadActivityService.logEmailActivity({
            companyId,
            leadId: lead._id,
            action: 'received',
            details: `Reply received: ${email.subject}`,
            metadata: { emailId: email._id, from: fromEmail },
          });
        }

        imported += 1;
        if (msg.uid > (account.imap?.lastUid || 0)) {
          account.imap = account.imap || {};
          account.imap.lastUid = msg.uid;
        }
      }
    } finally {
      lock.release();
    }

    account.imap = account.imap || {};
    account.imap.lastSyncAt = new Date();
    account.imap.lastSyncStatus = 'success';
    account.imap.lastImported = imported;
    await account.save();
  } catch (err) {
    account.imap = account.imap || {};
    account.imap.lastSyncAt = new Date();
    account.imap.lastSyncStatus = 'failed';
    account.imap.lastSyncError = err.message;
    await account.save();
    throw err;
  } finally {
    await client.logout().catch(() => {});
  }

  return { imported, skipped, lastSyncAt: account.imap.lastSyncAt };
}

async function getSyncStatus(companyId) {
  const accounts = await EmailSMTPAccount.find({ company: companyId, isActive: true })
    .select('name fromEmail provider imap lastSyncAt');
  return accounts.map((a) => ({
    _id: a._id,
    name: a.name,
    fromEmail: a.fromEmail,
    provider: a.provider,
    imapEnabled: a.imap?.enabled || false,
    lastSyncAt: a.imap?.lastSyncAt,
    lastSyncStatus: a.imap?.lastSyncStatus,
    lastImported: a.imap?.lastImported || 0,
    lastSyncError: a.imap?.lastSyncError,
  }));
}

async function configureImap(companyId, accountId, imapConfig) {
  const account = await EmailSMTPAccount.findOne({ _id: accountId, company: companyId });
  if (!account) throw new Error('Account not found');

  account.imap = {
    enabled: imapConfig.enabled !== false,
    host: imapConfig.host,
    port: imapConfig.port || 993,
    secure: imapConfig.secure !== false,
    username: imapConfig.username || account.username,
    passwordEncrypted: imapConfig.password ? require('../utils/encryption').encrypt(imapConfig.password) : account.imap?.passwordEncrypted,
    lastUid: account.imap?.lastUid || 0,
  };
  await account.save();
  return account;
}

module.exports = { syncAccount, getSyncStatus, configureImap, buildImapConfig };
