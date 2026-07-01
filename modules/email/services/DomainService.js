const EmailDomain = require('../models/EmailDomain');
const crypto = require('crypto');

async function listDomains(companyId) {
  return EmailDomain.find({ company: companyId }).sort({ createdAt: -1 });
}

async function addDomain(companyId, domain) {
  const verificationToken = crypto.randomBytes(16).toString('hex');
  return EmailDomain.create({
    company: companyId,
    domain: domain.toLowerCase(),
    verificationToken,
    spf: { record: `v=spf1 include:_spf.${domain} ~all`, verified: false, status: 'pending' },
    dkim: { selector: 'woxox', record: `${verificationToken}._domainkey.${domain}`, verified: false, status: 'pending' },
    dmarc: { record: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, verified: false, status: 'pending' },
  });
}

async function verifyDomain(companyId, domainId) {
  const domain = await EmailDomain.findOne({ _id: domainId, company: companyId });
  if (!domain) throw new Error('Domain not found');
  domain.status = 'verified';
  domain.spf.verified = true;
  domain.spf.status = 'verified';
  domain.dkim.verified = true;
  domain.dkim.status = 'verified';
  domain.dmarc.verified = true;
  domain.dmarc.status = 'verified';
  domain.healthScore = 100;
  domain.lastCheckedAt = new Date();
  await domain.save();
  return domain;
}

async function checkDnsHealth(companyId, domainId) {
  const domain = await EmailDomain.findOne({ _id: domainId, company: companyId });
  if (!domain) throw new Error('Domain not found');
  domain.lastCheckedAt = new Date();
  domain.healthScore = [domain.spf.verified, domain.dkim.verified, domain.dmarc.verified].filter(Boolean).length * 33;
  await domain.save();
  return domain;
}

async function deleteDomain(companyId, domainId) {
  const domain = await EmailDomain.findOneAndDelete({ _id: domainId, company: companyId });
  if (!domain) throw new Error('Domain not found');
  return { deleted: true };
}

module.exports = { listDomains, addDomain, verifyDomain, checkDnsHealth, deleteDomain };
