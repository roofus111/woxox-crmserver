const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for activity log
const activityLogSchema = new Schema({
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    referenceData: { type: mongoose.Schema.Types.Mixed }, // Optional: additional context or payload
    performedAt: { type: Date, default: Date.now }
  }, );

// Sub-schema for file attachments
const fileSchema = new Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
}, );

// Sub-schema for notes
const noteSchema = new Schema({
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});
  
// Main Task Schema
const taskSchema = new Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: {
    type: String,
    enum: ['Open', 'Cancelled', 'On Hold', 'Pending', 'Completed'],
    default: 'Open'
  },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activityLog: [activityLogSchema],
  files: [fileSchema],
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  completedAt: { type: Date },
  notes: [noteSchema]
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Task', taskSchema);
