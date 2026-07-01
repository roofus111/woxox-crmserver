const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatGroup",
    index: true
  },
  content: {
    type: String,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'location', 'sticker'],
    default: 'text'
  },
  // File-related fields
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  fileMimeType: String,
  fileMetadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Message status and tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true
  },
  deliveredAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: Date,
  
  // Read receipts
  readBy: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    readAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Message editing
  edited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  
  // Message deletion
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
  // Reply and forwarding
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  forwardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  forwardedAt: Date,
  
  // Reactions
  reactions: [reactionSchema],
  
  // Message metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Client-specific data
  clientMessageId: {
    type: String,
    sparse: true
  },
  
  // Priority and expiry
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: Date
});

// Indexes for better query performance
messageSchema.index({ createdAt: -1 });
messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ clientMessageId: 1 }, { sparse: true });

// Add updatedAt timestamp
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for reaction counts
messageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });
  return counts;
});

// Methods
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({ user: userId, emoji });
  }
  
  return this.save();
};

messageSchema.methods.softDelete = function(userId) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Static methods
messageSchema.statics.getMessageHistory = function(userId1, userId2, options = {}) {
  const { limit = 50, offset = 0, sort = -1 } = options;
  
  return this.find({
    $or: [
      { from: userId1, to: userId2 },
      { from: userId2, to: userId1 }
    ],
    deleted: { $ne: true }
  })
    .sort({ createdAt: sort })
    .skip(offset)
    .limit(limit)
    .populate('from', 'name avatar')
    .populate('to', 'name avatar');
};

module.exports = mongoose.model("Message", messageSchema); 