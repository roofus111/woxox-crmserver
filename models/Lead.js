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
  UGJoinYear :{
    type: Number,
  },
  UGPassOutYear:{
    type: Number,
  },
  UG_CGPA:{
    type: Number,
  },
  PGJoinYear:{
    type: Number,
  },
  PGPassOutYear:{
    type: Number,
  },
  PG_CGPA:{
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
const NoteSchema = new mongoose.Schema({
  author: { type: String},
  timestamp: { type: Date, default: Date.now },
  content: { type: String},
});
const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
  campaign: { type: String },
  campaignid: { type: mongoose.Schema.Types.ObjectId, ref: 'campaign'},
  status: { type: String, enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Pending', 'In Progress', 'Processing', 'Lost', 'Won','Duplicate'], default: 'New' },
  source: { type: String },
  Customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // This specifies that the default value can be null.
  },
  untouched:{type:Boolean,default:true},
  notes: [NoteSchema],
  createdAt: { type: Date, default: Date.now },
  profile: FormSchema,
  stages: { type: Number, default: null },
  additionalFields: { type: mongoose.Schema.Types.Mixed } 
  
},
{ timestamps: true });


LeadSchema.pre('save', function (next) {
  if (this._skipUpdatedAt) {
    this.$__.saveOptions.timestamps = false;
  }
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
