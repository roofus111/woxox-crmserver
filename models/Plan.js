const mongoose = require('mongoose');

const AddonSchema = new mongoose.Schema({
  addonId: { type: String, required: true },
  addonName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true, default: 'user' },
  free: { type: Boolean, default: false },
  OnTimeInstall: { type: Boolean, required: false },
  OnTimeInstallPrice: { type: Number, required: false },
  isActive: { type: Boolean, default: true },
  activatedDate: { type: Date, default: Date.now },
  deactivatedDate: { type: Date },
  total: { type: Number, required: true }
});

const PurchasePlanSchema = new mongoose.Schema({
  planName: { type: String, required: true },
  price: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  employeeLimit: { type: Number, required: true, default: 1 },
  leadLimit: { type: Number, required: true, default: 2000 },
  campaignLimit: { type: Number, required: true, default: 5 },
  moduleAccess: [AddonSchema],
  FreeAddons:[{ type: String }]
}, { _id: false });

const ModulePurchaseSchema = new mongoose.Schema({
  moduleName: { type: String, required: true },
  plans: [PurchasePlanSchema]
}, { _id: false });

const BillingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyName: { type: String, required: true },
  address: {
    country: { type: String, required: true },
    zipPostalCode: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    stateProvince: { type: String, required: true }
  }
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
  autoRenew: { type: Boolean, default: false },
  paymentMethod: { type: String },
  lastPaymentDate: { type: Date },
  nextPaymentDate: { type: Date },
  billingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing' }
});

module.exports = {
  CompanyPurchase: mongoose.model('Plan', CompanyPurchaseSchema)
};
