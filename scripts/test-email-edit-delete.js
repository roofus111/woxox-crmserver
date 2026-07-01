/**
 * Integration test for email module edit/delete endpoints.
 * Usage: node scripts/test-email-edit-delete.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const BASE = process.env.TEST_API_URL || 'http://localhost:8000';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(method, path, token, data, params) {
  const config = {
    method,
    url: `${BASE}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    params,
    validateStatus: () => true,
  };
  if (data !== undefined && data !== null) {
    config.headers['Content-Type'] = 'application/json';
    config.data = data;
  }
  return axios(config);
}

async function testResource(label, token, {
  createPath, createBody, getPath, updatePath, updateBody, deletePath, listPath,
}) {
  console.log(`\n[${label}]`);
  const createRes = await api('post', createPath, token, createBody);
  if (!createRes.data?.success && createRes.status >= 400) {
    fail(`${label} create`, createRes.data?.message || createRes.status);
    return;
  }
  const id = createRes.data?.data?._id;
  if (!id) {
    fail(`${label} create`, 'No id returned');
    return;
  }
  pass(`${label} create`, id);

  const getRes = await api('get', getPath(id), token);
  if (getRes.status === 200 && getRes.data?.success !== false) {
    pass(`${label} get`);
  } else {
    fail(`${label} get`, getRes.data?.message || getRes.status);
  }

  const updateRes = await api('put', updatePath(id), token, updateBody);
  if (updateRes.status === 200 && updateRes.data?.success !== false) {
    pass(`${label} update`);
  } else {
    fail(`${label} update`, updateRes.data?.message || updateRes.status);
  }

  const deleteRes = await api('delete', deletePath(id), token);
  if (deleteRes.status === 200 && deleteRes.data?.success !== false) {
    pass(`${label} delete`);
  } else {
    fail(`${label} delete`, deleteRes.data?.message || deleteRes.status);
  }

  if (listPath) {
    const listRes = await api('get', listPath, token);
    const items = listRes.data?.data || [];
    const stillThere = items.some((x) => x._id === id);
    if (!stillThere) pass(`${label} verify removed from list`);
    else fail(`${label} verify removed from list`, 'Item still in list');
  }
}

async function main() {
  console.log('Email edit/delete API tests');
  console.log(`API: ${BASE}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ role: 'admin', company: { $exists: true, $ne: null }, isActive: { $ne: false } });
  if (!user) {
    console.error('No admin user with company found in database.');
    process.exit(1);
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log(`User: ${user.email} (${user.role})`);

  const ts = Date.now();

  // Campaign
  console.log('\n[Campaign]');
  const campCreate = await api('post', '/api/email/campaigns', token, {
    name: `Test Campaign ${ts}`,
    type: 'regular',
    subject: 'Original subject',
    htmlContent: '<p>Test</p>',
  });
  if (campCreate.data?.data?._id) {
    const campId = campCreate.data.data._id;
    pass('Campaign create', campId);
    const campUpdate = await api('put', `/api/email/campaigns/${campId}`, token, {
      name: `Updated Campaign ${ts}`,
      subject: 'Updated subject',
    });
    campUpdate.status === 200 ? pass('Campaign update') : fail('Campaign update', campUpdate.data?.message);
    const campDelete = await api('delete', `/api/email/campaigns/${campId}`, token);
    campDelete.status === 200 ? pass('Campaign delete') : fail('Campaign delete', campDelete.data?.message);
  } else fail('Campaign create', campCreate.data?.message);

  // List
  await testResource('Contact List', token, {
    createPath: '/api/email/lists',
    createBody: { name: `Test List ${ts}`, type: 'static', description: 'Original' },
    getPath: (id) => `/api/email/lists/${id}`,
    updatePath: (id) => `/api/email/lists/${id}`,
    updateBody: { name: `Updated List ${ts}`, description: 'Updated' },
    deletePath: (id) => `/api/email/lists/${id}`,
    listPath: '/api/email/lists',
  });

  // Segment
  await testResource('Segment', token, {
    createPath: '/api/email/segments',
    createBody: { name: `Test Segment ${ts}`, rules: [{ field: 'leadStatus', operator: 'equals', value: 'New' }] },
    getPath: (id) => `/api/email/segments/${id}`,
    updatePath: (id) => `/api/email/segments/${id}`,
    updateBody: { name: `Updated Segment ${ts}` },
    deletePath: (id) => `/api/email/segments/${id}`,
    listPath: '/api/email/segments',
  });

  // Automation
  console.log('\n[Automation]');
  const autoCreate = await api('post', '/api/email/automations', token, {
    name: `Test Auto ${ts}`,
    trigger: { type: 'lead_created' },
    steps: [],
    flowData: { nodes: [], edges: [] },
  });
  if (autoCreate.data?.data?._id) {
    const autoId = autoCreate.data.data._id;
    pass('Automation create', autoId);
    const autoUpdate = await api('put', `/api/email/automations/${autoId}`, token, { name: `Updated Auto ${ts}` });
    autoUpdate.status === 200 ? pass('Automation update') : fail('Automation update', autoUpdate.data?.message);
    const autoDelete = await api('delete', `/api/email/automations/${autoId}`, token);
    autoDelete.status === 200 ? pass('Automation delete') : fail('Automation delete', autoDelete.data?.message);
  } else fail('Automation create', autoCreate.data?.message);

  // SMTP
  console.log('\n[SMTP Account]');
  const smtpCreate = await api('post', '/api/email/smtp', token, {
    name: `Test SMTP ${ts}`,
    provider: 'smtp',
    fromEmail: `test${ts}@example.com`,
    fromName: 'Test',
    host: 'smtp.example.com',
    port: 587,
    username: 'user',
    password: 'pass',
    dailyLimit: 100,
  });
  if (smtpCreate.data?.data?._id) {
    const smtpId = smtpCreate.data.data._id;
    pass('SMTP create', smtpId);
    const smtpUpdate = await api('put', `/api/email/smtp/${smtpId}`, token, { name: `Updated SMTP ${ts}`, dailyLimit: 200 });
    smtpUpdate.status === 200 ? pass('SMTP update') : fail('SMTP update', smtpUpdate.data?.message);
    const smtpDelete = await api('delete', `/api/email/smtp/${smtpId}`, token);
    smtpDelete.status === 200 ? pass('SMTP delete') : fail('SMTP delete', smtpDelete.data?.message);
  } else fail('SMTP create', smtpCreate.data?.message);

  // Domain
  console.log('\n[Domain]');
  const domCreate = await api('post', '/api/email/domains', token, { domain: `test-${ts}.example.com` });
  if (domCreate.data?.data?._id) {
    const domId = domCreate.data.data._id;
    pass('Domain create', domId);
    const domDelete = await api('delete', `/api/email/domains/${domId}`, token);
    domDelete.status === 200 ? pass('Domain delete') : fail('Domain delete', domDelete.data?.message);
  } else fail('Domain create', domCreate.data?.message);

  // Draft
  console.log('\n[Draft]');
  const draftCreate = await api('post', '/api/email/drafts', token, {
    subject: `Draft ${ts}`,
    to: [{ email: 'draft@test.com' }],
    htmlContent: '<p>Draft body</p>',
  });
  if (draftCreate.data?.data?._id) {
    const draftId = draftCreate.data.data._id;
    pass('Draft create', draftId);
    const draftGet = await api('get', `/api/email/drafts/${draftId}`, token);
    draftGet.status === 200 ? pass('Draft get') : fail('Draft get', draftGet.data?.message);
    const draftDelete = await api('delete', `/api/email/drafts/${draftId}`, token);
    draftDelete.status === 200 ? pass('Draft delete') : fail('Draft delete', draftDelete.data?.message);
  } else fail('Draft create', draftCreate.data?.message);

  // Suppression
  console.log('\n[Suppression]');
  const supEmail = `suppress-${ts}@example.com`;
  const supCreate = await api('post', '/api/email/suppression', token, { email: supEmail, reason: 'manual' });
  if (supCreate.data?.data?._id) {
    const supId = supCreate.data.data._id;
    pass('Suppression add', supId);
    const supDelete = await api('delete', `/api/email/suppression/${supId}`, token);
    supDelete.status === 200 ? pass('Suppression delete') : fail('Suppression delete', supDelete.data?.message);
  } else fail('Suppression add', supCreate.data?.message);

  // Webhook
  console.log('\n[Webhook]');
  const whCreate = await api('post', '/api/email/webhooks', token, {
    name: `Webhook ${ts}`,
    url: 'https://example.com/webhook',
    events: ['sent', 'opened'],
  });
  if (whCreate.data?.data?._id) {
    const whId = whCreate.data.data._id;
    pass('Webhook create', whId);
    const whUpdate = await api('put', `/api/email/webhooks/${whId}`, token, { name: `Updated Webhook ${ts}`, isActive: false });
    whUpdate.status === 200 ? pass('Webhook update') : fail('Webhook update', whUpdate.data?.message);
    const whDelete = await api('delete', `/api/email/webhooks/${whId}`, token);
    whDelete.status === 200 ? pass('Webhook delete') : fail('Webhook delete', whDelete.data?.message);
  } else fail('Webhook create', whCreate.data?.message);

  // Template (existing edit/delete)
  console.log('\n[Template]');
  const tplCreate = await api('post', '/api/email/templates', token, {
    name: `Test Template ${ts}`,
    subject: 'Template subject',
    htmlContent: '<p>Template</p>',
    category: 'Custom',
  });
  if (tplCreate.data?.data?._id) {
    const tplId = tplCreate.data.data._id;
    pass('Template create', tplId);
    const tplUpdate = await api('put', `/api/email/templates/${tplId}`, token, { name: `Updated Template ${ts}` });
    tplUpdate.status === 200 ? pass('Template update') : fail('Template update', tplUpdate.data?.message);
    const tplDelete = await api('delete', `/api/email/templates/${tplId}`, token);
    tplDelete.status === 200 ? pass('Template delete') : fail('Template delete', tplDelete.data?.message);
  } else fail('Template create', tplCreate.data?.message);

  // Email trash + permanent delete
  console.log('\n[Email]');
  const EmailMessage = require('../modules/email/models/Email');
  const emailDoc = await EmailMessage.create({
    company: user.company,
    direction: 'outbound',
    to: [{ email: `del-${ts}@example.com` }],
    from: { email: 'from@example.com', name: 'Test' },
    subject: `Delete test ${ts}`,
    htmlContent: '<p>delete me</p>',
    folder: 'inbox',
    status: 'delivered',
    createdBy: user._id,
  });
  const trashRes = await api('delete', `/api/email/emails/${emailDoc._id}`, token);
  if (trashRes.status === 200) {
    pass('Email move to trash');
    const trashed = await EmailMessage.findById(emailDoc._id);
    trashed?.folder === 'trash' ? pass('Email folder is trash') : fail('Email folder is trash', trashed?.folder);
    const permRes = await api('delete', `/api/email/emails/${emailDoc._id}`, token, null, { permanent: 'true' });
    permRes.status === 200 ? pass('Email permanent delete') : fail('Email permanent delete', permRes.data?.message);
    const gone = await EmailMessage.findById(emailDoc._id);
    gone === null ? pass('Email removed from database') : fail('Email removed from database');
  } else fail('Email move to trash', trashRes.data?.message);

  await mongoose.disconnect();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed}/${results.length} passed`);
  if (failed.length) {
    console.log('\nFailed:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log('All edit/delete tests passed.');
}

main().catch((err) => {
  console.error('Test run error:', err.message);
  process.exit(1);
});
