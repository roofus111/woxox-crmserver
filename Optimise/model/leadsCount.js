const mongoose = require('mongoose');

// Sub-schema: Source Conversion
const sourceConversionSchema = new mongoose.Schema({
  total: { type: Number, required: true },
  converted: { type: Number, required: true },
  conversionRate: { type: Number, required: true }
}, { timestamps: true });

// Sub-schema: Monthly Trend
const monthlyTrendSchema = new mongoose.Schema({
  count: { type: Number, required: true }
}, { timestamps: true });

// Sub-schema: Overall Summary
const overallSummarySchema = new mongoose.Schema({
  totalLeads: { type: Number, required: true },
  convertedLeads: { type: Number, required: true },
  conversionRate: { type: Number, required: true },
  untouchedLeads: { type: Number, required: true },
  untouchedPercentage: { type: Number, required: true }
}, { timestamps: true });

// Sub-schema: Metrics
const metricsSchema = new mongoose.Schema({
  averageNotesPerLead: { type: Number, required: true },
  mostCommonStatus: { type: String, required: true },
  mostCommonSource: { type: String, required: true },
  mostEffectiveSource: { type: String, required: true },
  mostActiveAssignee: { type: String, required: true }
}, { timestamps: true });

// Main schema: Lead Analytics
const leadAnalyticsSchema = new mongoose.Schema({
  overallSummary: { type: overallSummarySchema, required: true },

  statusBreakdown: {
    type: Map,
    of: Number,
    required: true
  },

  sourceBreakdown: {
    type: Map,
    of: Number,
    required: true
  },

  sourceConversionBreakdown: {
    type: Map,
    of: sourceConversionSchema,
    required: true
  },

  campaignBreakdown: {
    type: Map,
    of: Number,
    required: true
  },

  assignedToBreakdown: {
    type: Map,
    of: Number,
    required: true
  },

  monthlyTrends: {
    type: Map,
    of: monthlyTrendSchema,
    required: true
  },

  metrics: { type: metricsSchema, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeadAnalytics', leadAnalyticsSchema);
