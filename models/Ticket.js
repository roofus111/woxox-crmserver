const mongoose = require('mongoose');

// Sub-schema for Attachments
const AttachmentSchema = new mongoose.Schema({
  fileName: { type: String, 
    required: true 
},
  fileType:{ type: String},
  fileUrl: { type: String, 
    required: true
 },
});

// Sub-schema for Notes
const NoteSchema = new mongoose.Schema({
  note_id: { type: String,
     required: true 
    },
  author: { type: String, 
    required: true
 },
  timestamp: { type: Date, default: Date.now },
  content: { type: String, 
    required: true 
},
});

// Sub-schema for History
const HistorySchema = new mongoose.Schema({
  status: { type: String, default: "Open",
    required: true,
     enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
  changed_by: { type: String,
     required: true 
    },
  timestamp: { type: Date, default: Date.now },
});

// Main Ticket Schema
const TicketSchema = new mongoose.Schema({
  ticket_id: { type: String,
     required: true,
      unique: true, default: () => `TICKET-${new Date().getTime()}` }, // Auto-generated
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
  issue_details: {
    subject: { type: String, 
        required: true 
    },
    description: { type: String,
         required: true 
        },
    category: { type: String,
         required: true
         },
    sub_category: { type: String, 
        required: false 
    },
    priority: { type: String, 
        required: true,
         enum: ['Low', 'Medium', 'High', 'Critical'] },
    status: { type: String, required: true, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    attachments: [AttachmentSchema],
  },
  timestamps: {
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    resolved_at: { type: Date, default: null },
  },
assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // This specifies that the default value can be null.
  },
  notes: [NoteSchema],
  history: [HistorySchema],
  sla: {
    due_date: { type: Date, required: false },
    time_to_respond: { type: String, required: false },
    time_to_resolve: { type: String, required: false },
  },
//   custom_fields: {
//     visa_type: { type: String, required: false },
//     destination_country: { type: String, required: false },
//     reference_number: { type: String, required: false },
//   },
});

// Exporting the model
module.exports = mongoose.model('Ticket', TicketSchema);
