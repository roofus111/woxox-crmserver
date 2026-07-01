const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const slugify = require('slugify');
const { sanitizeEmailHtml } = require('../utils/sanitize');

const PREBUILT_TEMPLATES = [
  { name: 'Welcome Email', category: 'Welcome', subject: 'Welcome to {{CompanyName}}!', htmlContent: '<h1>Welcome {{FirstName | default:"Student"}}!</h1><p>We are excited to have you join us.</p>' },
  { name: 'Study Abroad Guide', category: 'Study Abroad', subject: 'Your Study Abroad Journey Starts Here', htmlContent: '<h1>Hello {{FirstName}}</h1><p>Explore opportunities in {{Country | default:"your dream country"}}.</p>' },
  { name: 'Offer Letter Notification', category: 'Offer Letter', subject: 'Congratulations! Your Offer Letter', htmlContent: '<h1>Congratulations {{FullName}}!</h1><p>Your offer from {{University}} is ready.</p>' },
  { name: 'Visa Approved', category: 'Visa Approved', subject: 'Visa Approved - {{FullName}}', htmlContent: '{% if VisaStatus == "Approved" %}<h1>Congratulations!</h1><p>Your visa has been approved.</p>{% endif %}' },
  { name: 'Payment Reminder', category: 'Payment Reminder', subject: 'Payment Reminder - {{PaymentAmount}}', htmlContent: '<p>Dear {{FirstName}}, this is a reminder about your pending payment.</p>' },
  { name: 'Newsletter', category: 'Newsletter', subject: '{{CompanyName}} Newsletter', htmlContent: '<h1>Monthly Updates</h1><p>Stay informed with the latest news.</p>' },
  { name: 'Birthday Wishes', category: 'Birthday', subject: 'Happy Birthday {{FirstName}}!', htmlContent: '<h1>Happy Birthday!</h1><p>Wishing you a wonderful day from all of us at {{CompanyName}}.</p>' },
];

async function logAction(companyId, userId, action, entityType, entityId, details = {}) {
  await EmailLog.create({ company: companyId, performedBy: userId, action, entityType, entityId, details });
}

async function listTemplates(companyId, { page = 1, limit = 20, category, status, search, folder } = {}) {
  const query = { company: companyId };
  if (category) query.category = category;
  if (status) query.status = status;
  if (folder) query.folder = folder;
  if (search) query.name = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailTemplate.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'name email'),
    EmailTemplate.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function getTemplate(companyId, id) {
  return EmailTemplate.findOne({ _id: id, company: companyId });
}

async function createTemplate(companyId, userId, data) {
  const template = await EmailTemplate.create({
    company: companyId,
    name: data.name,
    slug: slugify(data.name, { lower: true }),
    category: data.category || 'Custom',
    subject: data.subject,
    preheader: data.preheader,
    htmlContent: sanitizeEmailHtml(data.htmlContent),
    mjmlContent: data.mjmlContent,
    jsonDesign: data.jsonDesign,
    tags: data.tags,
    folder: data.folder || 'default',
    status: data.status || 'draft',
    createdBy: userId,
  });
  await logAction(companyId, userId, 'create', 'template', template._id, { name: template.name });
  return template;
}

async function updateTemplate(companyId, userId, id, data) {
  const template = await getTemplate(companyId, id);
  if (!template) throw new Error('Template not found');

  if (data.htmlContent || data.jsonDesign) {
    template.versions.push({
      version: template.version,
      htmlContent: template.htmlContent,
      jsonDesign: template.jsonDesign,
      createdBy: userId,
    });
    template.version += 1;
  }

  Object.assign(template, {
    ...data,
    htmlContent: data.htmlContent ? sanitizeEmailHtml(data.htmlContent) : template.htmlContent,
  });
  await template.save();
  await logAction(companyId, userId, 'update', 'template', template._id);
  return template;
}

async function duplicateTemplate(companyId, userId, id) {
  const original = await getTemplate(companyId, id);
  if (!original) throw new Error('Template not found');
  const copy = await EmailTemplate.create({
    ...original.toObject(),
    _id: undefined,
    name: `${original.name} (Copy)`,
    slug: slugify(`${original.name}-copy`, { lower: true }),
    status: 'draft',
    createdBy: userId,
    createdAt: undefined,
    updatedAt: undefined,
  });
  return copy;
}

async function seedPrebuiltTemplates(companyId, userId) {
  const existing = await EmailTemplate.countDocuments({ company: companyId });
  if (existing > 0) return { seeded: 0 };
  const docs = PREBUILT_TEMPLATES.map((t) => ({
    ...t,
    company: companyId,
    slug: slugify(t.name, { lower: true }),
    status: 'published',
    createdBy: userId,
  }));
  await EmailTemplate.insertMany(docs);
  return { seeded: docs.length };
}

async function exportMjml(template) {
  try {
    const mjml = require('mjml');
    const result = mjml(template.mjmlContent || `<mjml><mj-body><mj-section><mj-column><mj-text>${template.htmlContent || ''}</mj-text></mj-column></mj-section></mj-body></mjml>`);
    return { html: result.html, errors: result.errors };
  } catch (err) {
    return { html: template.htmlContent, errors: [err.message] };
  }
}

module.exports = {
  listTemplates, getTemplate, createTemplate, updateTemplate, duplicateTemplate,
  seedPrebuiltTemplates, exportMjml, logAction, PREBUILT_TEMPLATES,
};
