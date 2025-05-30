const mongoose = require('mongoose');
const { Schema } = mongoose;

const LeadActivitySchema = new Schema({
  company: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
   // User managing the lead
    },
   leadId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Lead", // Assuming you have a Lead model already
     required: true,
   },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'status_change', 'note_added', 'assigned', 'deleted','followUp','notPicked','Rescheduled','Answered','NotAnswered','Busy','Wrong Number','Not Reachable','Callback Requested','whatsapp_temp_sent'], // Various lead-related actions
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
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
});

const LeadActivity = mongoose.model('LeadActivityLog', LeadActivitySchema);

module.exports = LeadActivity;
