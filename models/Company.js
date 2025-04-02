const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  website: { type: String },
  profileImage: {
    fileName: { type: String },
    fileType: { type: String },
    fileUrl: { type: String }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  industry: { type: String },
  employees: { type: Number },
  createdAt: { type: Date, default: Date.now },
  Module:{
    Customer :{ type:Boolean ,default: false },
    lead :{ type:Boolean,default: false },
    pipeline :{ type:Boolean,default: false },
    finance :{ type:Boolean,default: false },
    documentation :{ type:Boolean,default: false },
  }
});

module.exports = mongoose.model('Company', CompanySchema);
