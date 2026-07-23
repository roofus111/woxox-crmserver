const axios = require('axios');
const EmailSMTPAccount = require('../models/SMTPAccount');
const SettingsService = require('./SettingsService');
const { encrypt } = require('../utils/encryption');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MS_SCOPES = ['https://outlook.office365.com/IMAP.AccessAsUser.All', 'https://outlook.office365.com/SMTP.Send', 'offline_access', 'email'].join(' ');

function getRedirectUri(provider) {
  const base =
    process.env.API_BASE_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.API_ORIGIN ||
    process.env.BACKEND_URL ||
    'http://localhost:8000';
  return `${base.replace(/\/$/, '')}/api/email/oauth/${provider}/callback`;
}

function getFrontendRedirect() {
  const base =
    process.env.FRONTEND_URL ||
    process.env.APP_ORIGIN ||
    process.env.CORS_ORIGIN?.split(',')[0] ||
    'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/en/manager/email/smtp?oauth=success`;
}

function buildGoogleAuthUrl(state, config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getRedirectUri('google'),
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

function buildMicrosoftAuthUrl(state, config) {
  const tenant = config.tenantId || 'common';
  const authUrl = MS_AUTH_URL.replace('common', tenant);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getRedirectUri('microsoft'),
    response_type: 'code',
    scope: MS_SCOPES,
    state,
  });
  return `${authUrl}?${params}`;
}

async function exchangeGoogleCode(code, config) {
  const res = await axios.post(GOOGLE_TOKEN_URL, new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: getRedirectUri('google'),
    grant_type: 'authorization_code',
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return res.data;
}

async function exchangeMicrosoftCode(code, config) {
  const tenant = config.tenantId || 'common';
  const tokenUrl = MS_TOKEN_URL.replace('common', tenant);
  const res = await axios.post(tokenUrl, new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: getRedirectUri('microsoft'),
    grant_type: 'authorization_code',
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return res.data;
}

async function getGoogleUserEmail(accessToken) {
  const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.email;
}

async function saveOAuthAccount(companyId, userId, provider, tokens, email, oauthConfig) {
  const payload = {
    company: companyId,
    name: `${provider === 'google' ? 'Gmail' : 'Microsoft 365'} - ${email}`,
    provider: provider === 'google' ? 'gmail_oauth' : 'office365',
    fromEmail: email,
    fromName: email.split('@')[0],
    oauthClientId: oauthConfig.clientId,
    oauthClientSecretEncrypted: encrypt(oauthConfig.clientSecret),
    oauthRefreshTokenEncrypted: encrypt(tokens.refresh_token),
    oauthAccessTokenEncrypted: encrypt(tokens.access_token),
    oauthTokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
    isDefault: false,
    isActive: true,
    createdBy: userId,
    imap: { enabled: true, host: provider === 'google' ? 'imap.gmail.com' : 'outlook.office365.com', port: 993, secure: true },
  };

  const existing = await EmailSMTPAccount.findOne({ company: companyId, fromEmail: email, provider: payload.provider });
  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  return EmailSMTPAccount.create(payload);
}

function parseOAuthState(state) {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid OAuth state');
  }
}

function buildOAuthState(companyId, userId) {
  return Buffer.from(JSON.stringify({ companyId: companyId.toString(), userId: userId.toString(), ts: Date.now() })).toString('base64url');
}

async function handleGoogleCallback(code, state) {
  const { companyId, userId } = parseOAuthState(state);
  const config = await SettingsService.getOAuthConfig(companyId, 'google');
  if (!config) throw new Error('Google OAuth not configured. Add credentials in Email Settings.');
  const tokens = await exchangeGoogleCode(code, config);
  const email = await getGoogleUserEmail(tokens.access_token);
  const account = await saveOAuthAccount(companyId, userId, 'google', tokens, email, config);
  return { account, redirectUrl: getFrontendRedirect() };
}

async function handleMicrosoftCallback(code, state) {
  const { companyId, userId } = parseOAuthState(state);
  const config = await SettingsService.getOAuthConfig(companyId, 'microsoft');
  if (!config) throw new Error('Microsoft OAuth not configured. Add credentials in Email Settings.');
  const tokens = await exchangeMicrosoftCode(code, config);
  let email = tokens.email;
  if (!email) {
    const res = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    email = res.data.mail || res.data.userPrincipalName;
  }
  if (!email) throw new Error('Could not retrieve Microsoft email');
  const account = await saveOAuthAccount(companyId, userId, 'microsoft', tokens, email, config);
  return { account, redirectUrl: getFrontendRedirect() };
}

async function getAuthUrls(companyId, userId) {
  const state = buildOAuthState(companyId, userId);
  const [googleConfig, msConfig] = await Promise.all([
    SettingsService.getOAuthConfig(companyId, 'google'),
    SettingsService.getOAuthConfig(companyId, 'microsoft'),
  ]);

  return {
    google: googleConfig ? buildGoogleAuthUrl(state, googleConfig) : null,
    microsoft: msConfig ? buildMicrosoftAuthUrl(state, msConfig) : null,
    googleConfigured: !!googleConfig,
    microsoftConfigured: !!msConfig,
  };
}

module.exports = {
  getAuthUrls, handleGoogleCallback, handleMicrosoftCallback,
  buildOAuthState, getFrontendRedirect,
};
