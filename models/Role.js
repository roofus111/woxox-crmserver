const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    scope: {
      type: String,
      enum: ['global', 'department', 'team'],
      default: 'global',
    },
    permissions: [{
      module: { type: String, required: true }, // e.g. 'employee', 'project', 'finance'
      actions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'approve', 'export'],
      }]
    }],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Role', roleSchema);
