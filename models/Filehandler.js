const mongoose = require("mongoose");

const SharedSchema = new mongoose.Schema({
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // User the file is shared with
  },
  sharedAt: {
    type: Date,
    default: Date.now, // Timestamp of when the file was shared
  },
  accessLevel: {
    type: String,
    enum: ["view", "edit", "admin"], // Access level when shared (view, edit, admin)
    default: "view", // Default access level
  },
});

const FileSchema = new mongoose.Schema({
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
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead", // Assuming you have a Lead model already
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
  docName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: false,
  },
  fileType: {
    type: String,
    required: false,
  },
  fileUrl: {
    type: String,
    required: false,
  },
  root: {
    type: Boolean, // Changed to Boolean
    default: false, // Default value for root (false indicating not a root file)
  },

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",// The name of the parent folder
  },
  access: {
    type: String,
    enum: ["public", "private", "restricted"], // Enum for access levels
    default: "private", // Default access level
  },
  shared: [SharedSchema], // Array of shared files with the shared schema
});


const Files = mongoose.model("Files", FileSchema);

module.exports = Files;
