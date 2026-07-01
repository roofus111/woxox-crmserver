const EmailSegment = require('../models/Segment');
const CampaignService = require('./CampaignService');

async function listSegments(companyId, { page = 1, limit = 20, search } = {}) {
  const query = { company: companyId };
  if (search) query.name = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailSegment.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    EmailSegment.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function createSegment(companyId, userId, data) {
  const segment = await EmailSegment.create({
    company: companyId,
    name: data.name,
    description: data.description,
    rules: data.rules || [],
    createdBy: userId,
  });
  const leads = await CampaignService.resolveSegmentLeads(companyId, segment.rules);
  segment.estimatedCount = leads.length;
  await segment.save();
  return segment;
}

async function getSegment(companyId, segmentId) {
  return EmailSegment.findOne({ _id: segmentId, company: companyId });
}

async function updateSegment(companyId, segmentId, data) {
  const segment = await EmailSegment.findOne({ _id: segmentId, company: companyId });
  if (!segment) throw new Error('Segment not found');

  if (data.name !== undefined) segment.name = data.name;
  if (data.description !== undefined) segment.description = data.description;
  if (data.rules !== undefined) {
    segment.rules = data.rules;
    const leads = await CampaignService.resolveSegmentLeads(companyId, segment.rules);
    segment.estimatedCount = leads.length;
  }

  await segment.save();
  return segment;
}

async function deleteSegment(companyId, segmentId) {
  const segment = await EmailSegment.findOneAndDelete({ _id: segmentId, company: companyId });
  if (!segment) throw new Error('Segment not found');
  return { deleted: true };
}

async function previewSegment(companyId, rules) {
  const leads = await CampaignService.resolveSegmentLeads(companyId, rules);
  return { count: leads.length, sample: leads.slice(0, 10).map((l) => ({ name: l.name, email: l.email, status: l.status })) };
}

module.exports = {
  listSegments, getSegment, createSegment, updateSegment, deleteSegment, previewSegment,
};
