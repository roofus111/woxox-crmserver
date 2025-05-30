const mongoose = require('mongoose');

// Schema for individual campaign objects
const campaignSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  totalLeads: { type: Number, required: true },
  convertedLeads: { type: Number, required: true },
  conversionRate: { type: Number, required: true },
  owner: { type: String, required: true },
  createdAt: { type: Date, required: true }
}, { timestamps: true }); // timestamps added, _id is included

// Schema for overall summary
const overallSummarySchema = new mongoose.Schema({
  totalCampaigns: { type: Number, required: true },
  activeCampaigns: { type: Number, required: true },
  totalLeadsGenerated: { type: Number, required: true },
  averageLeadsPerCampaign: { type: Number, required: true }
}, { timestamps: true });

// Schema for metrics
const metricsSchema = new mongoose.Schema({
  averageConversionRate: { type: Number, required: true },
  mostActiveCampaignOwner: { type: String, required: true },
  mostUsedPipeline: { type: String, required: true }
}, { timestamps: true });

// Schema for monthly trends
const monthlyTrendSchema = new mongoose.Schema({
  count: { type: Number, required: true }
}, { timestamps: true });

// Final campaign analytics schema
const campaignAnalyticsSchema = new mongoose.Schema({
  overallSummary: { type: overallSummarySchema, required: true },
  campaignPerformance: { type: [campaignSchema], required: true },
  topPerformingCampaigns: { type: [campaignSchema], required: true },
  userBreakdown: { type: Map, of: Number, required: true },
  pipelineBreakdown: { type: Map, of: Number, required: true },
  monthlyTrends: { type: Map, of: monthlyTrendSchema, required: true },
  metrics: { type: metricsSchema, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('CampaignAnalytics', campaignAnalyticsSchema);
