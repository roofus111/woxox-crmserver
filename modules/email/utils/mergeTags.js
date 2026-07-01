/**
 * Merge tag engine supporting {{Field}}, {{Lead.FirstName}}, defaults, conditionals, and loops.
 */

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function parseDefault(tag) {
  const match = tag.match(/^(.+?)\s*\|\s*default\s*:\s*"(.+)"\s*$/);
  if (match) return { key: match[1].trim(), fallback: match[2] };
  return { key: tag.trim(), fallback: '' };
}

function resolveValue(key, context) {
  const { key: field, fallback } = parseDefault(key);
  let value = getNestedValue(context, field);
  if (value === undefined || value === null || value === '') {
    const flatKey = field.includes('.') ? field.split('.').pop() : field;
    value = context[flatKey] ?? context[field];
  }
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function evaluateCondition(condition, context) {
  const match = condition.match(/^(.+?)\s*(==|!=|>|<|>=|<=)\s*"(.+)"\s*$/);
  if (!match) return false;
  const left = resolveValue(match[1].trim(), context);
  const op = match[2];
  const right = match[3];
  switch (op) {
    case '==': return left === right;
    case '!=': return left !== right;
    case '>': return Number(left) > Number(right);
    case '<': return Number(left) < Number(right);
    case '>=': return Number(left) >= Number(right);
    case '<=': return Number(left) <= Number(right);
    default: return false;
  }
}

function renderMergeTags(template, context = {}) {
  if (!template) return '';

  let output = template;

  output = output.replace(/\{%\s*if\s+(.+?)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/gi, (_, condition, body) =>
    (evaluateCondition(condition.trim(), context) ? body : '')
  );

  output = output.replace(/\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/gi, (_, itemName, listName, body) => {
    const list = context[listName] || [];
    if (!Array.isArray(list)) return '';
    return list.map((item) => {
      const loopContext = { ...context, [itemName]: item };
      return renderMergeTags(body, loopContext);
    }).join('');
  });

  output = output.replace(/\{\{([^}]+)\}\}/g, (_, key) => resolveValue(key.trim(), context));

  return output;
}

function buildLeadContext(lead, company = {}, user = {}) {
  if (!lead) return { ...company, ...user };
  const profile = lead.profile || {};
  const nameParts = (lead.name || '').split(' ');
  return {
    FirstName: nameParts[0] || '',
    LastName: nameParts.slice(1).join(' ') || '',
    FullName: lead.name || '',
    Email: lead.email || '',
    Phone: lead.phone || '',
    Country: profile.country || '',
    City: profile.city || '',
    State: profile.state || '',
    LeadSource: lead.source || '',
    AssignedCounselor: user.name || '',
    University: profile.programOfInterest || '',
    Course: profile.programOfInterest || '',
    Intake: profile.targetIntake || '',
    IELTSScore: profile.ieltsScore || '',
    TOEFLScore: profile.pteToeflScore || '',
    ApplicationStatus: lead.status || '',
    VisaStatus: profile.visaRefusal || '',
    CurrentDate: new Date().toLocaleDateString(),
    CurrentTime: new Date().toLocaleTimeString(),
    CompanyName: company.name || '',
    CompanyAddress: company.address || '',
    CompanyPhone: company.phone || '',
    CompanyWebsite: company.website || '',
    Lead: {
      FirstName: nameParts[0] || '',
      LastName: nameParts.slice(1).join(' ') || '',
      FullName: lead.name || '',
      Email: lead.email || '',
      Phone: lead.phone || '',
      Status: lead.status || '',
    },
    Counselor: { Name: user.name || '' },
    UniversityObj: { Name: profile.programOfInterest || '' },
  };
}

module.exports = { renderMergeTags, buildLeadContext, resolveValue };
