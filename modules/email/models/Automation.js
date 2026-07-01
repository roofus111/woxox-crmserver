const mongoose = require('mongoose');

const WorkflowStepSchema = new mongoose.Schema({
  type: { type: String, enum: ['send_email', 'delay', 'wait', 'condition', 'tag', 'webhook', 'update_crm', 'branch'], required: true },
  config: mongoose.Schema.Types.Mixed,
  nextStepId: String,
  branchSteps: [{ condition: String, stepId: String }],
  position: { x: Number, y: Number },
});

const AutomationSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  trigger: {
    type: { type: String, enum: [
      'lead_created', 'lead_updated', 'application_submitted', 'visa_approved',
      'birthday', 'payment_pending', 'payment_received', 'lead_assigned', 'lead_lost',
    ], required: true },
    config: mongoose.Schema.Types.Mixed,
  },
  steps: [WorkflowStepSchema],
  flowData: {
    nodes: [{ id: String, type: String, position: { x: Number, y: Number }, data: mongoose.Schema.Types.Mixed }],
    edges: [{ id: String, source: String, target: String, label: String }],
  },
  status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
  stats: { triggered: Number, completed: Number, failed: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailAutomation', AutomationSchema);
