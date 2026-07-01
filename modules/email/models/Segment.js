const mongoose = require('mongoose');

const EmailSegmentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  rules: [{
    field: String,
    operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in'] },
    value: mongoose.Schema.Types.Mixed,
    logic: { type: String, enum: ['and', 'or'], default: 'and' },
  }],
  estimatedCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailSegment', EmailSegmentSchema);
