const EmailAutomation = require('../models/Automation');

async function listAutomations(companyId, { page = 1, limit = 20, status } = {}) {
  const query = { company: companyId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailAutomation.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    EmailAutomation.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function getAutomation(companyId, id) {
  return EmailAutomation.findOne({ _id: id, company: companyId });
}

async function updateAutomation(companyId, id, data) {
  const automation = await EmailAutomation.findOne({ _id: id, company: companyId });
  if (!automation) throw new Error('Automation not found');

  if (data.name) automation.name = data.name;
  if (data.description) automation.description = data.description;
  if (data.trigger) automation.trigger = data.trigger;
  if (data.steps) automation.steps = data.steps;
  if (data.flowData) automation.flowData = data.flowData;
  if (data.status) automation.status = data.status;

  await automation.save();
  return automation;
}

async function createAutomation(companyId, userId, data) {
  return EmailAutomation.create({
    company: companyId,
    name: data.name,
    description: data.description,
    trigger: data.trigger,
    steps: data.steps || [],
    flowData: data.flowData || { nodes: [], edges: [] },
    status: data.status || 'draft',
    createdBy: userId,
  });
}

async function updateAutomationStatus(companyId, id, status) {
  return EmailAutomation.findOneAndUpdate({ _id: id, company: companyId }, { status }, { new: true });
}

async function deleteAutomation(companyId, id) {
  const automation = await EmailAutomation.findOneAndDelete({ _id: id, company: companyId });
  if (!automation) throw new Error('Automation not found');
  return { deleted: true };
}

async function triggerAutomation(companyId, triggerType, payload) {
  const automations = await EmailAutomation.find({ company: companyId, status: 'active', 'trigger.type': triggerType });
  for (const automation of automations) {
    await EmailAutomation.findByIdAndUpdate(automation._id, { $inc: { 'stats.triggered': 1 } });
    // Step execution would be handled by queue workers in production
  }
  return automations.length;
}

module.exports = {
  listAutomations, getAutomation, createAutomation, updateAutomation,
  updateAutomationStatus, deleteAutomation, triggerAutomation,
};
