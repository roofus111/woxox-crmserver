const mongoose = require('mongoose');

const TagModelSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    }, // Name of the tag
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    }, // URL-friendly identifier for the tag     
    description: { 
      type: String, 
      maxlength: 200 
    }, // Optional description for the tag
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  // Middleware to update `updatedAt` field
  TagModelSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });
  
  const TagModel = mongoose.model('TagModel', TagModelSchema);
  module.exports = TagModel;
  