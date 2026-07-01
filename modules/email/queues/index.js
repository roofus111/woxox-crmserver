const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

let connection = null;
let emailQueue = null;
let campaignQueue = null;
let imapQueue = null;
let workersInitialized = false;

function getConnection() {
  if (!connection && process.env.REDIS_HOST) {
    connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return connection;
}

function getEmailQueue() {
  if (!emailQueue && getConnection()) {
    emailQueue = new Queue('email-outbound', { connection: getConnection() });
  }
  return emailQueue;
}

function getCampaignQueue() {
  if (!campaignQueue && getConnection()) {
    campaignQueue = new Queue('email-campaign', { connection: getConnection() });
  }
  return campaignQueue;
}

async function addEmailJob(data, delayMs = 0) {
  const queue = getEmailQueue();
  if (!queue) {
    console.warn('Redis unavailable - processing email synchronously');
    const SmtpService = require('../services/SmtpService');
    const EmailMessage = require('../models/Email');
    const email = await EmailMessage.findById(data.emailId);
    if (!email) return null;
    return SmtpService.sendEmail(data.companyId, {
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent,
      fromName: email.from?.name,
      fromEmail: email.from?.email,
      replyTo: email.replyTo,
      leadId: email.lead,
      campaignId: email.campaign,
      smtpAccount: email.smtpAccount,
    }, { userId: data.userId, existingEmailId: data.emailId });
  }
  return queue.add('send-email', data, {
    delay: delayMs,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

async function addCampaignJob(data, delayMs = 0) {
  return addEmailJob(data, delayMs);
}

function initWorkers() {
  if (workersInitialized || !getConnection()) return;
  workersInitialized = true;

  const SmtpService = require('../services/SmtpService');
  const EmailMessage = require('../models/Email');
  const EmailCampaign = require('../models/EmailCampaign');
  const EmailAnalytics = require('../models/EmailAnalytics');

  const processEmail = async (job) => {
    const { emailId, companyId, campaignId, userId } = job.data;
    const email = await EmailMessage.findById(emailId);
    if (!email || email.status === 'cancelled') return;

    try {
      await SmtpService.sendEmail(companyId, {
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        htmlContent: email.htmlContent,
        textContent: email.textContent,
        fromName: email.from?.name,
        fromEmail: email.from?.email,
        replyTo: email.replyTo,
        leadId: email.lead,
        campaignId: email.campaign,
        smtpAccount: email.smtpAccount,
      }, { userId, existingEmailId: emailId });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await EmailAnalytics.findOneAndUpdate(
        { company: companyId, campaign: campaignId || null, date: today },
        { $inc: { sent: 1, delivered: 1 } },
        { upsert: true }
      );

      if (campaignId) {
        await EmailCampaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.sent': 1, 'stats.delivered': 1 } });
      }
    } catch (err) {
      await EmailMessage.findByIdAndUpdate(emailId, { status: 'failed', errorMessage: err.message });
      if (campaignId) {
        await EmailCampaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.failed': 1 } });
      }
      throw err;
    }
  };

  new Worker('email-outbound', processEmail, { connection: getConnection() });
  new Worker('email-campaign', processEmail, { connection: getConnection() });

  const ImapSyncService = require('../services/ImapSyncService');

  new Worker('email-imap-sync', async (job) => {
    const { accountId, companyId } = job.data;
    const result = await ImapSyncService.syncAccount(accountId, companyId);
    return result;
  }, { connection: getConnection() });

  // Schedule IMAP sync every 5 minutes for enabled accounts
  if (!global.__emailImapCronStarted) {
    global.__emailImapCronStarted = true;
    setInterval(async () => {
      try {
        const EmailSMTPAccount = require('../models/SMTPAccount');
        const accounts = await EmailSMTPAccount.find({ isActive: true, 'imap.enabled': true }).limit(20);
        for (const account of accounts) {
          await addImapSyncJob({ accountId: account._id.toString(), companyId: account.company.toString() }, 0);
        }
      } catch (err) {
        console.warn('IMAP cron error:', err.message);
      }
    }, 5 * 60 * 1000);
  }

  console.log('Email queue workers initialized');
}

async function addImapSyncJob(data, delayMs = 0) {
  if (!getConnection()) {
    const ImapSyncService = require('../services/ImapSyncService');
    const result = await ImapSyncService.syncAccount(data.accountId, data.companyId);
    return { processedSync: true, result };
  }
  if (!imapQueue) imapQueue = new Queue('email-imap-sync', { connection: getConnection() });
  return imapQueue.add('sync-inbox', data, {
    delay: delayMs,
    attempts: 2,
    removeOnComplete: 50,
  });
}

module.exports = { addEmailJob, addCampaignJob, addImapSyncJob, initWorkers, getEmailQueue };
