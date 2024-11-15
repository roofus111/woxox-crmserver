const mongoose = require('mongoose');

const StageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const PipelineSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model for sales representatives
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  stages: [StageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update 'updatedAt' on modifications
PipelineSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Pipeline = mongoose.model('Pipeline', PipelineSchema);

module.exports = Pipeline;