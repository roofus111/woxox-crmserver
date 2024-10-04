const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  website: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  industry: { type: String },
  employees: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', CompanySchema);
