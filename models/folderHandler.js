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
const FolderSchema = new mongoose.Schema({
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
  folderName: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folders",// The name of the parent folder
  },
  root: {
    type: Boolean, // Changed to Boolean
    default: false, // Default value for root (false indicating not a root file)
  },
  access: {
    type: String,
    enum: ["public", "private", "restricted"], // Enum for access levels
    default: "private", // Default access level
  },
  shared: [SharedSchema], // Array of shared files with the shared schema
});

const Folders = mongoose.model("Folders", FolderSchema);

module.exports = Folders;