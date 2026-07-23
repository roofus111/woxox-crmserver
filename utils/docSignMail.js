const nodemailer = require('nodemailer')

function createTransporter() {
  const config = {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    }
  }

  if (!config.host || !config.auth.user) {
    return null
  }

  return nodemailer.createTransport(config)
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

async function sendSignerInvite({ envelope, signer, isReminder = false }) {
  const transporter = createTransporter()
  const link = signLink(signer.token)
  const subject = isReminder
    ? `Reminder: please sign “${envelope.title}”`
    : `Please sign “${envelope.title}”`

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">${isReminder ? 'Reminder to sign' : 'Signature requested'}</h2>
      <p>Hi ${signer.name || 'there'},</p>
      <p>${envelope.message || 'You have been asked to review and sign a document.'}</p>
      <p><strong>Document:</strong> ${envelope.title}</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
          Review &amp; sign
        </a>
      </p>
      <p style="font-size:13px;color:#64748b">Or open this link:<br/><a href="${link}">${link}</a></p>
    </div>
  `

  if (!transporter) {
    console.warn('[docsign] SMTP not configured — invite link:', link)
    return { skipped: true, link }
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER

  await transporter.sendMail({
    from,
    to: signer.email,
    subject,
    html
  })

  return { skipped: false, link }
}

module.exports = {
  sendSignerInvite,
  signLink,
  frontendBase
}
