const EmailSettings = require('../models/EmailSettings');
const { encrypt, decrypt, maskSecret } = require('../utils/encryption');

const SECRET_FIELDS = {
  google: ['clientSecret'],
  microsoft: ['clientSecret'],
  smtp: ['password'],
  sendgrid: ['apiKey'],
  mailgun: ['apiKey'],
  amazonSes: ['accessKey', 'secretKey'],
  brevo: ['apiKey'],
  postmark: ['apiKey'],
  s3: ['accessKey', 'secretKey'],
};

function isMaskedOrEmpty(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'string' && /^[\*•.]{4,}$/.test(value)) return true;
  return false;
}

function decryptField(encrypted) {
  if (!encrypted) return '';
  try {
    return decrypt(encrypted);
  } catch {
    return '';
  }
}

async function getOrCreateSettings(companyId) {
  let settings = await EmailSettings.findOne({ company: companyId });
  if (!settings) {
    settings = await EmailSettings.create({ company: companyId });
  }
  return settings;
}

function maskCredentialsForResponse(credentials) {
  const masked = {};
  Object.keys(SECRET_FIELDS).forEach((provider) => {
    const data = credentials?.[provider] || {};
    masked[provider] = {
      enabled: !!data.enabled,
      host: data.host || '',
      port: data.port || 587,
      secure: !!data.secure,
      username: data.username || '',
      fromEmail: data.fromEmail || '',
      fromName: data.fromName || '',
      clientId: data.clientId || '',
      tenantId: data.tenantId || 'common',
      domain: data.domain || '',
      region: data.region || '',
      bucket: data.bucket || '',
    };
    SECRET_FIELDS[provider].forEach((field) => {
      const encKey = `${field}Encrypted`;
      const hasSecret = !!data[encKey];
      masked[provider][field] = hasSecret ? maskSecret('secret') : '';
      masked[provider][`${field}Configured`] = hasSecret;
    });
  });
  return masked;
}

async function getSettingsForApi(companyId) {
  let settings = await EmailSettings.findOne({ company: companyId })
    .select('+credentials.google.clientSecretEncrypted +credentials.microsoft.clientSecretEncrypted +credentials.smtp.passwordEncrypted +credentials.sendgrid.apiKeyEncrypted +credentials.mailgun.apiKeyEncrypted +credentials.amazonSes.accessKeyEncrypted +credentials.amazonSes.secretKeyEncrypted +credentials.brevo.apiKeyEncrypted +credentials.postmark.apiKeyEncrypted +credentials.s3.accessKeyEncrypted +credentials.s3.secretKeyEncrypted');

  if (!settings) {
    settings = await getOrCreateSettings(companyId);
  }

  const obj = settings.toObject();
  obj.credentials = maskCredentialsForResponse(obj.credentials || {});
  return obj;
}

async function updateSettings(companyId, userId, data) {
  const settings = await getOrCreateSettings(companyId);

  const generalFields = [
    'defaultFromName', 'defaultFromEmail', 'defaultReplyTo',
    'trackingEnabled', 'openTracking', 'clickTracking', 'unsubscribeLink',
    'approvalRequired', 'autosaveInterval', 'rateLimitPerHour', 'notifications',
  ];
  generalFields.forEach((key) => {
    if (data[key] !== undefined) settings[key] = data[key];
  });

  if (data.credentials) {
    settings.credentials = settings.credentials || {};
    applyCredentialsUpdate(settings, data.credentials);
    settings.credentialsConfiguredAt = new Date();
    settings.credentialsUpdatedBy = userId;
  }

  await settings.save();
  return getSettingsForApi(companyId);
}

function applyCredentialsUpdate(settings, incoming) {
  Object.entries(incoming).forEach(([provider, payload]) => {
    if (!payload || typeof payload !== 'object') return;
    settings.credentials[provider] = settings.credentials[provider] || {};

    const target = settings.credentials[provider];
    const { enabled, host, port, secure, username, fromEmail, fromName, domain, region, tenantId, clientId, bucket } = payload;

    if (enabled !== undefined) target.enabled = enabled;
    if (clientId !== undefined) target.clientId = clientId;
    if (tenantId !== undefined) target.tenantId = tenantId;
    if (host !== undefined) target.host = host;
    if (port !== undefined) target.port = port;
    if (secure !== undefined) target.secure = secure;
    if (username !== undefined) target.username = username;
    if (fromEmail !== undefined) target.fromEmail = fromEmail;
    if (fromName !== undefined) target.fromName = fromName;
    if (domain !== undefined) target.domain = domain;
    if (region !== undefined) target.region = region;
    if (bucket !== undefined) target.bucket = bucket;

    if (provider === 'google' && !isMaskedOrEmpty(payload.clientSecret)) {
      target.clientSecretEncrypted = encrypt(payload.clientSecret);
    }
    if (provider === 'microsoft' && !isMaskedOrEmpty(payload.clientSecret)) {
      target.clientSecretEncrypted = encrypt(payload.clientSecret);
    }
    if (provider === 'smtp' && !isMaskedOrEmpty(payload.password)) {
      target.passwordEncrypted = encrypt(payload.password);
    }
    if (['sendgrid', 'brevo', 'postmark', 'mailgun'].includes(provider) && !isMaskedOrEmpty(payload.apiKey)) {
      target.apiKeyEncrypted = encrypt(payload.apiKey);
    }
    if (provider === 'amazonSes') {
      if (!isMaskedOrEmpty(payload.accessKey)) target.accessKeyEncrypted = encrypt(payload.accessKey);
      if (!isMaskedOrEmpty(payload.secretKey)) target.secretKeyEncrypted = encrypt(payload.secretKey);
    }
    if (provider === 's3') {
      if (!isMaskedOrEmpty(payload.accessKey)) target.accessKeyEncrypted = encrypt(payload.accessKey);
      if (!isMaskedOrEmpty(payload.secretKey)) target.secretKeyEncrypted = encrypt(payload.secretKey);
    }
  });
}

async function getDecryptedCredentials(companyId) {
  const settings = await EmailSettings.findOne({ company: companyId })
    .select('+credentials.google.clientSecretEncrypted +credentials.microsoft.clientSecretEncrypted +credentials.smtp.passwordEncrypted +credentials.sendgrid.apiKeyEncrypted +credentials.mailgun.apiKeyEncrypted +credentials.amazonSes.accessKeyEncrypted +credentials.amazonSes.secretKeyEncrypted +credentials.brevo.apiKeyEncrypted +credentials.postmark.apiKeyEncrypted +credentials.s3.accessKeyEncrypted +credentials.s3.secretKeyEncrypted');

  if (!settings?.credentials) return null;

  const c = settings.credentials;
  return {
    google: c.google?.enabled ? {
      clientId: c.google.clientId || process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: decryptField(c.google.clientSecretEncrypted) || process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    } : null,
    microsoft: c.microsoft?.enabled ? {
      clientId: c.microsoft.clientId || process.env.MICROSOFT_OAUTH_CLIENT_ID,
      clientSecret: decryptField(c.microsoft.clientSecretEncrypted) || process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
      tenantId: c.microsoft.tenantId || 'common',
    } : null,
    smtp: c.smtp?.enabled ? {
      host: c.smtp.host,
      port: c.smtp.port,
      secure: c.smtp.secure,
      username: c.smtp.username,
      password: decryptField(c.smtp.passwordEncrypted),
      fromEmail: c.smtp.fromEmail,
      fromName: c.smtp.fromName,
    } : null,
    sendgrid: c.sendgrid?.enabled ? { apiKey: decryptField(c.sendgrid.apiKeyEncrypted) } : null,
    mailgun: c.mailgun?.enabled ? { apiKey: decryptField(c.mailgun.apiKeyEncrypted), domain: c.mailgun.domain, region: c.mailgun.region } : null,
    amazonSes: c.amazonSes?.enabled ? {
      accessKey: decryptField(c.amazonSes.accessKeyEncrypted),
      secretKey: decryptField(c.amazonSes.secretKeyEncrypted),
      region: c.amazonSes.region,
    } : null,
    s3: c.s3?.enabled ? {
      accessKey: decryptField(c.s3.accessKeyEncrypted),
      secretKey: decryptField(c.s3.secretKeyEncrypted),
      bucket: c.s3.bucket,
      region: c.s3.region,
    } : null,
  };
}

async function getOAuthConfig(companyId, provider) {
  const creds = await getDecryptedCredentials(companyId);
  if (provider === 'google') {
    const google = creds?.google;
    if (google?.clientId && google?.clientSecret) return google;
    if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
      return { clientId: process.env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET };
    }
    return null;
  }
  if (provider === 'microsoft') {
    const ms = creds?.microsoft;
    if (ms?.clientId && ms?.clientSecret) return ms;
    if (process.env.MICROSOFT_OAUTH_CLIENT_ID && process.env.MICROSOFT_OAUTH_CLIENT_SECRET) {
      return { clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID, clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET, tenantId: 'common' };
    }
    return null;
  }
  return null;
}

module.exports = {
  getSettingsForApi,
  updateSettings,
  getDecryptedCredentials,
  getOAuthConfig,
};
