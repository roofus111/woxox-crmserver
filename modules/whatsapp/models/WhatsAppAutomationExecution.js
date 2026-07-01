const mongoose = require('mongoose');

const WhatsAppAutomationExecutionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    rule: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppAutomationRule', required: true },
    triggerData: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    currentStep: { type: Number, default: 0 },
    results: [{ type: mongoose.Schema.Types.Mixed }],
    error: { type: String, default: '' },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

WhatsAppAutomationExecutionSchema.index({ rule: 1, status: 1 });

module.exports = mongoose.model('WhatsAppAutomationExecution', WhatsAppAutomationExecutionSchema);
