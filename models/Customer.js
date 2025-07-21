const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  firstName: { type: String, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String,trim: true, lowercase: true },
  phone: { type: String, required: true,trim: true },
  qualification: { type: String, trim: true },
  occupation: { type: String },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true }  
  },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes: { type: String, trim: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; // Make sure you're exporting the model
