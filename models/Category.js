const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'],
    index: true
  },
  color: {
    type: String,
    default: '#000000'  // For UI representation
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically handle createdAt and updatedAt
});

// Method to get full category path
categorySchema.methods.getPath = async function() {
  let path = [this.name];
  let current = this;
  
  while (current.parentCategory) {
    current = await mongoose.model('Category').findById(current.parentCategory);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }
  
  return path.join(' > ');
};

module.exports = mongoose.model('Category', categorySchema);
