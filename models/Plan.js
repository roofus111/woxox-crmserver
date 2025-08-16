const mongoose = require('mongoose');

const PurchasePlanSchema = new mongoose.Schema({
  planName: { type: String, required: true },
  price: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  employeeLimit: { type: Number, required: true, default: 1 },
  moduleAccess: {
    hr: { type: Boolean, default: false },
    customer: { type: Boolean, default: false },
    lead: { type: Boolean, default: false },
    pipeline: { type: Boolean, default: false },
    finance: { type: Boolean, default: false },
    documentation: { type: Boolean, default: false }
  }
}, { _id: false });

const ModulePurchaseSchema = new mongoose.Schema({
  moduleName: { type: String, required: true },
  plans: [PurchasePlanSchema]
}, { _id: false });

const CompanyPurchaseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  modules: [ModulePurchaseSchema],
  purchaseDate: { type: Date, default: Date.now },
  validTill: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'expired', 'cancelled'], 
    default: 'active' 
  },
  planType: { type: String, enum: ['free trial', 'basic', 'premium', 'enterprise'], default: 'free trial' },
  employeeLimit: { type: Number, default: 1 },
  autoRenew: { type: Boolean, default: false },
  paymentMethod: { type: String },
  lastPaymentDate: { type: Date },
  nextPaymentDate: { type: Date }
});

module.exports = {
  CompanyPurchase: mongoose.model('Plan', CompanyPurchaseSchema)
};
