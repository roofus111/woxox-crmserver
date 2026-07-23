const mongoose = require('mongoose');

const chatPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    peerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    peerType: {
      type: String,
      enum: ['user', 'group'],
      default: 'user',
    },
    muted: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    draft: { type: String, default: '' },
  },
  { timestamps: true }
);

chatPreferenceSchema.index({ userId: 1, peerId: 1, peerType: 1 }, { unique: true });

module.exports = mongoose.model('ChatPreference', chatPreferenceSchema);
