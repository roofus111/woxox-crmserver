const LeadActivity = require('../../../models/LeadActivity');

const ACTION_MAP = {
  sent: 'email_sent',
  received: 'email_received',
  opened: 'email_opened',
  clicked: 'email_clicked',
  bounced: 'email_bounced',
  spam: 'email_spam',
  unsubscribed: 'email_unsubscribed',
  replied: 'email_replied',
  attachment_downloaded: 'email_attachment_downloaded',
};

/**
 * Log email activity on a lead timeline.
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.leadId
 * @param {string} params.action - key from ACTION_MAP or full enum value
 * @param {string} [params.details]
 * @param {string} [params.userId]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @param {object} [params.metadata]
 */
async function logEmailActivity({
  companyId,
  leadId,
  action,
  details = '',
  userId = null,
  ipAddress = '0.0.0.0',
  userAgent = '',
  metadata = {},
}) {
  if (!leadId || !companyId) return null;

  const mappedAction = ACTION_MAP[action] || action;
  const validActions = [
    'email_sent', 'email_received', 'email_opened', 'email_clicked', 'email_bounced',
    'email_spam', 'email_unsubscribed', 'email_replied', 'email_attachment_downloaded',
  ];
  if (!validActions.includes(mappedAction)) return null;

  return LeadActivity.create({
    company: companyId,
    leadId,
    userId,
    action: mappedAction,
    details,
    ipAddress: ipAddress || '0.0.0.0',
    userAgent,
    metadata,
  });
}

/**
 * Log from an email document.
 */
async function logFromEmail(email, action, details, req = {}) {
  return logEmailActivity({
    companyId: email.company,
    leadId: email.lead,
    action,
    details: details || email.subject,
    userId: email.createdBy,
    ipAddress: req.ip || '0.0.0.0',
    userAgent: req.headers?.['user-agent'] || '',
    metadata: { emailId: email._id, subject: email.subject, campaignId: email.campaign },
  });
}

module.exports = { logEmailActivity, logFromEmail, ACTION_MAP };
