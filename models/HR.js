const mongoose = require('mongoose');
const crypto = require('crypto');

  // Sub-schema for Attachments
const AttachmentSchema = new mongoose.Schema({
    fileName: { type: String, 
      required: true 
  },
    fileType:{ type: String},
    fileUrl: { type: String, 
      required: true
   },
  });

  
  
  // // **Performance Schema**
  // const PerformanceSchema = new mongoose.Schema({
  //   employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee',
  //       // required: true 
  //       },
  //   reviewDate: { type: Date, required: false },
  //   reviewPeriod: { type: String }, // E.g., "Q1 2025"
  //   rating: { type: Number, min: 1, max: 5, required: false },
  //   feedback: { type: String },
  //   goals: { type: String },
  //   createdAt: { type: Date, default: Date.now },
  // });
  

  // // **Training Schema**
  // const TrainingSchema = new mongoose.Schema({
  //   trainingName: { type: String, required: false },
  //   description: { type: String },
  //   startDate: { type: Date, required: false },
  //   endDate: { type: Date, required: false },
  //   employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  //   createdAt: { type: Date, default: Date.now },
  // });
  // **History Schema**
const HistorySchema = new mongoose.Schema({
  activityType: { 
    type: String, 
    enum: ['Employee Updated', 'Job Title Change', 'Department Change', 'Status Update', 'Attendance Added','Attendance Update', 'Salary Update', 'Leave Change', 'Performance Update', 'Training Added','Grant Access Online', 'Invitation Sent', 'Invitation Accepted'], 
    required: true 
  },
  description: { type: String, required: true },
  changedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Referring to the user who made the change (e.g., HR or Admin)
    required: true 
  },
  changedAt: { type: Date, default: Date.now },
  oldValue: { type: String }, // Store old value before the change (optional, can be null)
  newValue: { type: String }, // Store new value after the change
});

  const EmployeeSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
      },
      User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Assuming you have a User model for sales representatives
        // required: true,
      },
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    startDate: { type: Date, required: false },
    endDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    jobTitle: { type: String, required: false },
    department: { type: String, required: false }, // E.g., "Sales", "Marketing", "Support"
    role: { type: String,     enum: ["admin", "manager", "user", "guest","hr","docteam","finance",'pipeline'], required: false },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Reporting manager
    attachments:[AttachmentSchema],
    attendence: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }, 
    payroll :{ type: mongoose.Schema.Types.ObjectId, ref: 'Payroll' },
    
    // Invitation fields
    invitationAccepted: { type: Boolean, default: false },
    invitationToken: { type: String },
    invitationSentAt: { type: Date },
    invitationExpiresAt: { type: Date },
    
    // performance:[PerformanceSchema],
    // training:[TrainingSchema],
    salary: { type: Number },
    history: [HistorySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

// Index for invitation token
EmployeeSchema.index({ invitationToken: 1 });
EmployeeSchema.index({ invitationExpiresAt: 1 });

// Method to generate invitation token
EmployeeSchema.methods.generateInvitationToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Method to create invitation
EmployeeSchema.methods.createInvitation = function() {
  this.invitationToken = this.generateInvitationToken();
  this.invitationSentAt = new Date();
  this.invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  this.invitationAccepted = false;
  return this.save();
};

// Method to check if invitation is valid
EmployeeSchema.methods.isInvitationValid = function() {
  // Check if invitation exists, is not accepted, and hasn't expired
  if (!this.invitationToken || this.invitationAccepted || !this.invitationExpiresAt) {
    return false;
  }
  return new Date() < this.invitationExpiresAt;
};

// Method to accept invitation
EmployeeSchema.methods.acceptInvitation = function() {
  this.invitationAccepted = true;
  // Clear the token and set expiry to past to ensure link expires immediately
  this.invitationToken = undefined;
  this.invitationExpiresAt = new Date(Date.now() - 1000); // Set to 1 second ago
  return this.save();
};

// Method to clear invitation
EmployeeSchema.methods.clearInvitation = function() {
  this.invitationToken = undefined;
  this.invitationSentAt = undefined;
  this.invitationExpiresAt = undefined;
  this.invitationAccepted = false;
  return this.save();
};

// Method to check if invitation has been accepted
EmployeeSchema.methods.isInvitationAccepted = function() {
  return this.invitationAccepted === true;
};

// Static method to find employee by invitation token
EmployeeSchema.statics.findByInvitationToken = function(token) {
  return this.findOne({ invitationToken: token });
};

// Pre-save middleware to update updatedAt
EmployeeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

  module.exports = mongoose.model('Employee', EmployeeSchema);