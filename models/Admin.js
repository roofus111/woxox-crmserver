const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentHistorySchema = new Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  method: { 
    type: String, 
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cash'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['paid', 'pending', 'failed'], 
    default: 'paid' 
  }
});

const BillingSchema = new Schema({
  invoiceNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  details: { type: String }
});

const AdminSchema = new Schema({
  adminName: { type: String, required: true },
  numberOfClients: { type: Number, default: 0 },
  plans: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],  // just plan IDs
  dateOfRegister: { type: Date, default: Date.now },
  dateOfExpiry: { type: Date, required: true },
  billings: [BillingSchema],
  paymentHistory: [PaymentHistorySchema]
});

module.exports = mongoose.model('Admin', AdminSchema);
