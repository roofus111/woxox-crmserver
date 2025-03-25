const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
},
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    // required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#FFFFFF',
    trim: true
  },
  leadsCount: {
    type: Number,
    default: 0
  },
  filesCount: {
    type: Number,
    default: 0
  },
  
}, { timestamps: true });

// Method to increment leads count
tagSchema.methods.incrementLeadsCount = function() {
  this.leadsCount += 1;
  return this.save();
};

// Method to decrement leads count
tagSchema.methods.decrementLeadsCount = function() {
  if (this.leadsCount > 0) {
    this.leadsCount -= 1;
    return this.save();
  }
  return Promise.resolve(); // No change if count is already 0
};

// Method to increment files count
tagSchema.methods.incrementFilesCount = function() {
  this.filesCount += 1;
  return this.save();
};

// Method to decrement files count
tagSchema.methods.decrementFilesCount = function() {
  if (this.filesCount > 0) {
    this.filesCount -= 1;
    return this.save();
  }
  return Promise.resolve(); // No change if count is already 0
};

// Method to get counts in the desired format
tagSchema.methods.getCounts = function() {
  return {
    [this.name]: {
      leads: this.leadsCount,
      files: this.filesCount
    }
  };
};

const TagManager = mongoose.model('TagManager', tagSchema);

module.exports = TagManager;
