const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  type: {
    type: String,
    enum: [
      'lead_assigned',
      'lead_status_change',
      'ticket_created',
      'ticket_updated',
      'ticket_assigned',
      'task_assigned',
      'task_due',
      'task_completed',
      'payment_received',
      'payment_due',
      'document_shared',
      'follow_up_reminder',
      'leave_request',
      'leave_approved',
      'leave_rejected',
      'expense_approved',
      'expense_rejected',
      'message_received',
      'event_reminder'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Lead', 'Ticket', 'Task', 'Payment', 'Document', 'FollowUp', 'Leave', 'Expense', 'Message', 'Event'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  readAt: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
NotificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ company: 1, type: 1 });
NotificationSchema.index({ 'relatedEntity.entityId': 1, 'relatedEntity.entityType': 1 });

// Pre-save middleware to handle readAt timestamp
NotificationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
