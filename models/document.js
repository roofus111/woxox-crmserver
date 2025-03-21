const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true, // ID of the lead being managed
  },
  docName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
