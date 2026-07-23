const mongoose = require('mongoose');

const PersonalWhatsAppSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['disconnected', 'qr', 'connecting', 'connected', 'logged_out', 'error'],
      default: 'disconnected',
    },
    phoneNumber: { type: String, default: '' },
    pushName: { type: String, default: '' },
    lastQrAt: { type: Date },
    connectedAt: { type: Date },
    lastError: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PersonalWhatsAppSession', PersonalWhatsAppSessionSchema);
