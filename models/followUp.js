const mongoose = require("mongoose");

const leadFollowUpSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead", // Assuming you have a Lead model already
    required: true,
  },
  followUpDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Closed"],
    default: "Pending",
  },
  notes: {
    type: String,
    required: false,
  },
  nextFollowUpDate: {
    type: Date,
    required: false,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model for sales representatives
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date, 
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completionNote: {
    type: String,
    required: false,
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
});

leadFollowUpSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const LeadFollowUp = mongoose.model("LeadFollowUp", leadFollowUpSchema);

module.exports = LeadFollowUp;
