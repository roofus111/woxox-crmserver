const mongoose = require('mongoose');
const { Schema } = mongoose;

const LeadActivitySchema = new Schema({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,  // ID of the lead being managed
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,  // User managing the lead
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'status_change', 'note_added', 'assigned', 'deleted','followUp','notPicked'], // Various lead-related actions
  },
  timestamp: {
    type: Date,
    default: Date.now,  // When the activity occurred
  },
  details: {
    type: String, 
    required: false,  // Any additional details regarding the action (e.g., status change from X to Y)
  },
  ipAddress: {
    type: String,
    required: true,  // IP address where the action was performed
  },
  userAgent: {
    type: String,
  }
});

const LeadActivity = mongoose.model('LeadActivity', LeadActivitySchema);

module.exports = LeadActivity;
