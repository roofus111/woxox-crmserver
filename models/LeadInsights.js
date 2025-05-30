const mongoose = require('mongoose');

const leadInsightsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  totalLeads: {
    type: Number,
    default: 0
  },
  statusBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  sourceBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  sourceConversionBreakdown: {
    type: Map,
    of: {
      total: Number,
      converted: Number,
      conversionRate: Number
    },
    default: {}
  },
  campaignBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  assignedToBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  monthlyTrends: {
    type: Map,
    of: {
      count: Number
    },
    default: {}
  },
  metrics: {
    averageNotesPerLead: Number,
    mostCommonStatus: String,
    mostCommonSource: String,
    mostEffectiveSource: String,
    mostActiveAssignee: String
  }
}, {
  timestamps: true
});

// Index for faster queries
leadInsightsSchema.index({ company: 1, updatedAt: -1 });

module.exports = mongoose.model('LeadInsights', leadInsightsSchema); 