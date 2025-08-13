const mongoose = require('mongoose');

// Cart item schema for individual products/services in cart
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductService',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // For product variants
  variant: {
    name: String,
    price: Number,
    sku: String,
    attributes: { type: Map, of: String }
  },
  // For service packages
  package: {
    name: String,
    price: Number,
    durationDays: Number,
    features: [String]
  },
  // Custom options/notes for the item
  notes: String,
  // Dynamic form data if applicable
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Cart schema
const cartSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Cart items
  items: [cartItemSchema],
  
  // Cart status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted', 'expired'],
    default: 'active'
  },
  
  // Pricing information
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Discount information
  appliedDiscounts: [{
    code: String,
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    description: String,
    appliedAt: { type: Date, default: Date.now }
  }],
  
  // Shipping information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  
  // Billing information 
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'digital_wallet', 'other'],
    default: 'other'
  },
  
  // Cart metadata
  notes: String,
  tags: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Cart expires in 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate;
    }
  },
  
  // Conversion tracking
  convertedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  convertedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
cartSchema.index({ customer: 1, company: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => {
    const itemPrice = item.variant?.price || item.package?.price || item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  
  next();
});

// Instance methods
cartSchema.methods.addItem = function(productId, quantity = 1, options = {}) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.variant) === JSON.stringify(options.variant) &&
    JSON.stringify(item.package) === JSON.stringify(options.package)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      price: options.price,
      variant: options.variant,
      package: options.package,
      notes: options.notes,
      customFields: options.customFields
    });
  }
  
  return this.save();
};

cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this.save();
};

cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  return this.save();
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  this.subtotal = 0;
  this.total = 0;
  return this.save();
};

cartSchema.methods.applyDiscount = function(discountCode, discountType, discountValue, description) {
  this.appliedDiscounts.push({
    code: discountCode,
    type: discountType,
    value: discountValue,
    description
  });
  
  if (discountType === 'percentage') {
    this.discount = (this.subtotal * discountValue) / 100;
  } else {
    this.discount = discountValue;
  }
  
  return this.save();
};

cartSchema.methods.convertToOrder = function() {
  this.status = 'converted';
  this.convertedAt = new Date();
  return this.save();
};

// Static methods
cartSchema.statics.findByCustomer = function(customerId, companyId) {
  return this.findOne({
    customer: customerId,
    company: companyId,
    status: 'active'
  });
};

cartSchema.statics.findAbandonedCarts = function(daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.find({
    status: 'active',
    updatedAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Cart', cartSchema);
