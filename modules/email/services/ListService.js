const EmailContactList = require('../models/ContactList');
const Lead = require('../../../models/Lead');
const xlsx = require('xlsx');

async function listLists(companyId, { page = 1, limit = 20, search, type } = {}) {
  const query = { company: companyId };
  if (type) query.type = type;
  if (search) query.name = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailContactList.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    EmailContactList.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

async function createList(companyId, userId, data) {
  return EmailContactList.create({
    company: companyId,
    name: data.name,
    type: data.type || 'static',
    description: data.description,
    contacts: data.contacts || [],
    dynamicRules: data.dynamicRules,
    tags: data.tags,
    contactCount: data.contacts?.length || 0,
    createdBy: userId,
  });
}

async function importFromLeads(companyId, listId) {
  const list = await EmailContactList.findOne({ _id: listId, company: companyId });
  if (!list) throw new Error('List not found');

  const leads = await Lead.find({ company: companyId, email: { $exists: true, $ne: '' } }).limit(5000);
  const existing = new Set(list.contacts.map((c) => c.email.toLowerCase()));

  leads.forEach((lead) => {
    if (!existing.has(lead.email.toLowerCase())) {
      list.contacts.push({
        email: lead.email,
        firstName: lead.name?.split(' ')[0],
        lastName: lead.name?.split(' ').slice(1).join(' '),
        phone: lead.phone,
        lead: lead._id,
      });
      existing.add(lead.email.toLowerCase());
    }
  });

  list.contactCount = list.contacts.length;
  await list.save();
  return list;
}

async function importCsv(companyId, listId, buffer) {
  const list = await EmailContactList.findOne({ _id: listId, company: companyId });
  if (!list) throw new Error('List not found');

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  const existing = new Set(list.contacts.map((c) => c.email?.toLowerCase()));

  rows.forEach((row) => {
    const email = row.email || row.Email;
    if (!email || existing.has(email.toLowerCase())) return;
    list.contacts.push({
      email,
      firstName: row.firstName || row.FirstName || row.first_name,
      lastName: row.lastName || row.LastName || row.last_name,
      phone: row.phone || row.Phone,
    });
    existing.add(email.toLowerCase());
  });

  list.contactCount = list.contacts.length;
  await list.save();
  return { imported: list.contactCount, list };
}

async function getList(companyId, listId) {
  return EmailContactList.findOne({ _id: listId, company: companyId });
}

async function updateList(companyId, listId, data) {
  const list = await EmailContactList.findOne({ _id: listId, company: companyId });
  if (!list) throw new Error('List not found');

  if (data.name !== undefined) list.name = data.name;
  if (data.description !== undefined) list.description = data.description;
  if (data.type !== undefined) list.type = data.type;
  if (data.tags !== undefined) list.tags = data.tags;
  if (data.dynamicRules !== undefined) list.dynamicRules = data.dynamicRules;
  if (data.contacts !== undefined) {
    list.contacts = data.contacts;
    list.contactCount = data.contacts.length;
  }

  await list.save();
  return list;
}

async function deleteList(companyId, listId) {
  const list = await EmailContactList.findOneAndDelete({ _id: listId, company: companyId });
  if (!list) throw new Error('List not found');
  return { deleted: true };
}

async function addToSuppression(companyId, email, reason, userId) {
  const SuppressionList = require('../models/SuppressionList');
  return SuppressionList.findOneAndUpdate(
    { company: companyId, email: email.toLowerCase() },
    { reason, addedBy: userId },
    { upsert: true, new: true }
  );
}

async function removeFromSuppression(companyId, id) {
  const SuppressionList = require('../models/SuppressionList');
  const item = await SuppressionList.findOneAndDelete({ _id: id, company: companyId });
  if (!item) throw new Error('Suppression entry not found');
  return { deleted: true };
}

module.exports = {
  listLists, getList, createList, updateList, deleteList,
  importFromLeads, importCsv, addToSuppression, removeFromSuppression,
};
