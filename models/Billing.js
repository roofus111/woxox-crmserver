const mongoose = require('mongoose');

const BillingSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      country: { type: String, required: true },
      zipPostalCode: { type: String, required: true },
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      stateProvince: { type: String, required: true }
    },
    Plan:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    Payment:{       
            subtotal: { type: Number, required: true },
            tax: { type: Number, required: true },
            total: { type: Number, required: true },
            discount: { type: Number },
            finalTotal: { type: Number, required: true },
            savings: { type: Number },
            originalTotal: { type: Number, required: true },
            planCost: { type: Number, required: true },
            productsCost: { type: Number, required: true },
            additionalUsersCost: { type: Number, required: true }        
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    }
  }, { timestamps: true });

module.exports = mongoose.model('Billing', BillingSchema);