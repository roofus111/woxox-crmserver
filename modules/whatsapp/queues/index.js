const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

let connection = null;
let broadcastQueue = null;
let messageQueue = null;
let schedulerQueue = null;
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

function getBroadcastQueue() {
  if (!broadcastQueue && getConnection()) {
    broadcastQueue = new Queue('whatsapp-broadcast', { connection: getConnection() });
  }
  return broadcastQueue;
}

/**
 * Add a broadcast message job to the queue.
 * @param {object} data
 * @returns {Promise<object>}
 */
async function addBroadcastJob(data) {
  const queue = getBroadcastQueue();
  if (!queue) {
    console.warn('Redis unavailable - broadcast job skipped');
    return null;
  }
  return queue.add('send-broadcast', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

/**
 * Add outbound message job.
 * @param {object} data
 * @returns {Promise<object>}
 */
async function addMessageJob(data) {
  if (!getConnection()) return null;
  if (!messageQueue) messageQueue = new Queue('whatsapp-messages', { connection: getConnection() });
  return messageQueue.add('send-message', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}

/**
 * Add scheduled message job.
 * @param {object} data
 * @param {number} delayMs
 * @returns {Promise<object>}
 */
async function addScheduledJob(data, delayMs) {
  if (!getConnection()) return null;
  if (!schedulerQueue) schedulerQueue = new Queue('whatsapp-scheduler', { connection: getConnection() });
  return schedulerQueue.add('scheduled-message', data, {
    delay: delayMs,
    attempts: 3,
  });
}

/**
 * Initialize BullMQ workers for WhatsApp jobs.
 */
function initWorkers() {
  if (workersInitialized || !getConnection()) return;
  workersInitialized = true;

  const BroadcastService = require('../services/BroadcastService');
  const MessageService = require('../services/MessageService');
  const ConversationService = require('../services/ConversationService');
  const WhatsAppBroadcast = require('../models/WhatsAppBroadcast');

  new Worker('whatsapp-broadcast', async (job) => {
    const { broadcastId, companyId, recipient } = job.data;
    const broadcast = await WhatsAppBroadcast.findById(broadcastId);
    if (!broadcast || broadcast.status === 'cancelled') return;

    let conversation;
    if (recipient.contact) {
      conversation = await ConversationService.getOrCreate(
        companyId, recipient.contact._id, recipient.leadId
      );
    }

    if (conversation) {
      await MessageService.sendOutbound({
        companyId,
        conversationId: conversation._id,
        contactId: recipient.contact?._id,
        phone: recipient.phone,
        type: broadcast.messageType === 'template' ? 'template' : 'text',
        content: broadcast.message,
        templateName: broadcast.template?.name,
        leadId: recipient.leadId,
      });

      await WhatsAppBroadcast.findByIdAndUpdate(broadcastId, {
        $inc: { 'stats.sent': 1 },
      });
    }
  }, { connection: getConnection(), concurrency: 5 });

  new Worker('whatsapp-scheduler', async (job) => {
    const ScheduledMessage = require('../models/WhatsAppScheduledMessage');
    const { scheduledMessageId } = job.data;
    const scheduled = await ScheduledMessage.findById(scheduledMessageId);
    if (!scheduled || scheduled.status === 'cancelled') return;

    await MessageService.sendOutbound({
      companyId: scheduled.company.toString(),
      conversationId: scheduled.conversation,
      contactId: scheduled.contact,
      phone: scheduled.contact?.phone,
      type: scheduled.messageType,
      content: scheduled.content,
      templateName: scheduled.template?.name,
      leadId: scheduled.lead,
      userId: scheduled.createdBy,
    });

    await ScheduledMessage.findByIdAndUpdate(scheduledMessageId, {
      status: 'sent',
      sentAt: new Date(),
    });
  }, { connection: getConnection(), concurrency: 3 });

  console.log('WhatsApp BullMQ workers initialized');
}

module.exports = {
  getBroadcastQueue,
  addBroadcastJob,
  addMessageJob,
  addScheduledJob,
  initWorkers,
};
