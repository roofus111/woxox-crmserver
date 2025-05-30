const mongoose = require('mongoose');

// Sub-schema: Overall Summary
const OverallSummarySchema = new mongoose.Schema({
  totalEmployees: { type: Number, required: true },
  activeEmployees: { type: Number, required: true },
  inactiveEmployees: { type: Number, required: true },
  activePercentage: { type: Number, required: true }
}, { timestamps: true });

// Sub-schema: Tenure Analysis
const TenureAnalysisSchema = new mongoose.Schema({
  averageTenure: { type: Number, required: true },
  longestTenure: { type: Number, required: true },
  shortestTenure: { type: Number, required: true },
  tenureDistribution: {
    type: Map,
    of: Number,
    required: true
  }
}, { timestamps: true });

// Sub-schema: Salary Stats
const SalaryStatsSchema = new mongoose.Schema({
  averageSalary: { type: Number, required: true },
  minSalary: { type: Number, required: true },
  maxSalary: { type: Number, required: true },
  medianSalary: { type: Number, required: true }
}, { timestamps: true });

// Sub-schema: Recent Activity
const RecentActivitySchema = new mongoose.Schema({
  activityType: { type: String, required: true },
  description: { type: String, required: true },
  changedAt: { type: Date, required: true },
  changedBy: { type: String, required: true }
}, { timestamps: true });

// Sub-schema: Metrics
const MetricsSchema = new mongoose.Schema({
  largestDepartment: { type: String, required: true },
  mostCommonJobTitle: { type: String, required: true },
  mostCommonRole: { type: String, required: true }
}, { timestamps: true });

// Main Schema
const EmployeeAnalyticsSchema = new mongoose.Schema({
  overallSummary: { type: OverallSummarySchema, required: true },
  departmentBreakdown: { type: Map, of: Number, required: true },
  jobTitleBreakdown: { type: Map, of: Number, required: true },
  roleBreakdown: { type: Map, of: Number, required: true },
  genderBreakdown: { type: Map, of: Number, required: true },
  tenureAnalysis: { type: TenureAnalysisSchema, required: true },
  hiringTrends: { type: Map, of: Number, default: {} },
  salaryStats: { type: SalaryStatsSchema, required: true },
  recentActivities: { type: [RecentActivitySchema], default: [] },
  metrics: { type: MetricsSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeAnalytics', EmployeeAnalyticsSchema);
