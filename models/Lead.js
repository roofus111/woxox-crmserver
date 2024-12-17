const mongoose = require('mongoose');
const FormSchema = new mongoose.Schema({
  age: {
    type: Number,
  },
  address: {
    type: String,
  },
  pinCode: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  sslcJoinYear: {
    type: Number,
  },
  sslcPassOutYear: {
    type: Number,
  },
  sslcScore: {
    type: Number,
  },
  hscJoinYear: {
    type: Number,
  },
  hscPassOutYear: {
    type: Number,
  },
  hscScore: {
    type: Number,
  },
  ieltsScore: {
    type: Number,
  },
  pteToeflScore: {
    type: Number,
  },
  germanScore: {
    type: Number,
  },
  xiiEnglishScore: {
    type: Number,
  },
  careerGapFrom: {
    type: Number,
  },
  careerGapTo: {
    type: Number,
  },
  experienceFrom: {
    type: Number,
  },
  experienceTo: {
    type: Number,
  },
  backlogs: {
    type: Number,
  },
  targetIntake: {
    type: String,
  },
  programOfInterest: {
    type: String,
  },
  countryOfInterest: {
    type: String,
  },
  visaRefusal: {
    type: String,
  },
  tuitionFeePreference: {
    type: Number,
  }
});
const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  campaign: { type: String },
  campaignid: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign'},
  status: { type: String, enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Pending', 'In Progress', 'Lost', 'Won'], default: 'New' },
  source: { type: String },
  Customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // This specifies that the default value can be null.
  },
  untouched:{type:Boolean,default:true},

  createdAt: { type: Date, default: Date.now },
  profile: FormSchema,
  stages: { type: String, enum: [null, 'Pending', 'In Progress', 'Document Collected', 'Pending Documents', 'Application Submitted', 'Interview Scheduled', 'Offer letter Received', 'Offer letter Rejected', 'Visa Documentation In Progress', 'Visa Documentation Success', 'Visa Approved', 'Visa Rejected'], default: null },
  additionalFields: { type: mongoose.Schema.Types.Mixed } 
});

module.exports = mongoose.model('Lead', LeadSchema);
