const SmtpService = require('../modules/email/services/SmtpService')

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function frontendBase() {
  return (
    process.env.FRONTEND_URL ||
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.woxox.com'
  ).replace(/\/$/, '')
}

function signLink(token, lang = 'en') {
  return `${frontendBase()}/${lang}/sign/${token}`
}

function inviteHtml({ title, message, signerName, link, isReminder }) {
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:560px">
      <h2 style="margin:0 0 12px;color:#0f766e">${isReminder ? 'Reminder to sign' : 'Signature requested'}</h2>
      <p>Hi ${escapeHtml(signerName || 'there')},</p>
      <p>${escapeHtml(message || 'You have been asked to review and sign a document.')}</p>
      <p><strong>Document:</strong> ${escapeHtml(title)}</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(link)}" style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
          Review &amp; sign
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">Or open this link:<br/><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
      <p style="font-size:12px;color:#94a3b8;margin-top:28px">Sent via WOXOX Doc Sign</p>
    </div>
  `
}

/**
 * Send Doc Sign mail through company SMTP (Email → SMTP) with platform SES fallback.
 */
async function sendViaCompanyMail({
  companyId,
  toEmail,
  toName,
  subject,
  html,
  userId,
  leadId
}) {
  if (!companyId) {
    throw new Error('Company is required to send Doc Sign email')
  }
  if (!toEmail) {
    throw new Error('Recipient email is required')
  }

  await SmtpService.sendEmail(
    companyId,
    {
      to: [{ email: String(toEmail).toLowerCase().trim(), name: toName || '' }],
      subject,
      htmlContent: html,
      leadId: leadId || undefined
    },
    {
      trackOpens: false,
      trackClicks: false,
      userId: userId || undefined
    }
  )
}

async function sendSignerInvite({
  envelope,
  signer,
  isReminder = false,
  userId
}) {
  const link = signLink(signer.token)
  const subject = isReminder
    ? `Reminder: please sign "${envelope.title}"`
    : `Please sign "${envelope.title}"`
  const html = inviteHtml({
    title: envelope.title,
    message: envelope.message,
    signerName: signer.name,
    link,
    isReminder
  })

  try {
    await sendViaCompanyMail({
      companyId: envelope.company,
      toEmail: signer.email,
      toName: signer.name,
      subject,
      html,
      userId,
      leadId: envelope.leadId
    })
    return { sent: true, skipped: false, link, email: signer.email }
  } catch (error) {
    console.error('[docsign] invite mail failed:', error.message)
    return {
      sent: false,
      skipped: false,
      error: error.message || 'Failed to send email',
      link,
      email: signer.email
    }
  }
}

async function sendCompletionNotice({ envelope, recipient, signedUrl, userId }) {
  const link = signedUrl || signLink(recipient.token || '')
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#0f766e">Document fully signed</h2>
      <p>Hi ${escapeHtml(recipient.name || 'there')},</p>
      <p><strong>${escapeHtml(envelope.title)}</strong> has been completed by all signers.</p>
      ${
        signedUrl
          ? `<p><a href="${escapeHtml(signedUrl)}" style="background:#0f766e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Download signed PDF</a></p>`
          : ''
      }
      <p style="font-size:12px;color:#94a3b8">WOXOX Doc Sign</p>
    </div>
  `
  return sendViaCompanyMail({
    companyId: envelope.company,
    toEmail: recipient.email,
    toName: recipient.name,
    subject: `Completed: "${envelope.title}"`,
    html,
    userId,
    leadId: envelope.leadId
  }).then(() => ({ sent: true, email: recipient.email })).catch(err => ({
    sent: false,
    email: recipient.email,
    error: err.message
  }))
}

async function sendDeclineNotice({ envelope, signer, reason, creatorEmail, creatorName, userId }) {
  if (!creatorEmail) return { sent: false, skipped: true }
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#b91c1c">Signature declined</h2>
      <p>Hi ${escapeHtml(creatorName || 'there')},</p>
      <p><strong>${escapeHtml(signer.name)}</strong> (${escapeHtml(signer.email)}) declined <strong>${escapeHtml(envelope.title)}</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
    </div>
  `
  return sendViaCompanyMail({
    companyId: envelope.company,
    toEmail: creatorEmail,
    toName: creatorName,
    subject: `Declined: "${envelope.title}"`,
    html,
    userId,
    leadId: envelope.leadId
  }).then(() => ({ sent: true })).catch(err => ({ sent: false, error: err.message }))
}

async function checkMailReady(companyId) {
  try {
    const account = await SmtpService.getAccount(companyId)
    if (!account) {
      return {
        ready: false,
        message: 'No SMTP mailbox configured. Connect one under Email → SMTP Settings (or set platform SMTP env).'
      }
    }
    return {
      ready: true,
      fromEmail: account.fromEmail,
      fromName: account.fromName,
      provider: account.provider,
      isVirtual: Boolean(account.isVirtual)
    }
  } catch (error) {
    return { ready: false, message: error.message }
  }
}

module.exports = {
  sendSignerInvite,
  sendCompletionNotice,
  sendDeclineNotice,
  checkMailReady,
  signLink,
  frontendBase,
  escapeHtml
}
