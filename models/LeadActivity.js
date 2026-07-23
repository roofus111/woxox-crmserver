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
    enum: [
      'created', 'updated', 'status_change', 'note_added', 'assigned', 'deleted',
      'followUp', 'notPicked', 'Rescheduled', 'Answered', 'NotAnswered', 'Busy',
      'Wrong Number', 'Not Reachable', 'Callback Requested',
      'ticket_created', 'sale_created',
      'whatsapp_temp_sent', 'whatsapp_message_received', 'whatsapp_message_sent',
      'email_sent', 'email_received', 'email_opened', 'email_clicked', 'email_bounced',
      'email_spam', 'email_unsubscribed', 'email_replied', 'email_attachment_downloaded',
    ],
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
    default: '0.0.0.0',
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false,
  },
  userAgent: {
    type: String,
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
});

const LeadActivity = mongoose.model('LeadActivityLog', LeadActivitySchema);

module.exports = LeadActivity;
