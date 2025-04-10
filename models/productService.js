const mongoose = require('mongoose');

// 📸 Image schema
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: String,
  caption: String,
  sortOrder: { type: Number, default: 0 },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

// 🎛️ Variant schema (Product-specific)
const variantSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number,
  sku: String,
  attributes: { type: Map, of: String },
  metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

// 🕒 Schedule schema (Service-specific)
const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: String,
  endTime: String
}, { _id: false });

// 💼 Package schema (Service-specific)
const packageSchema = new mongoose.Schema({
  name: String,
  price: Number,
  features: [String],
  durationDays: Number,
  metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

// 🧩 Dynamic form fields
const dynamicFieldSchema = new mongoose.Schema({
  label: String,
  type: {
    type: String,
    enum: ['text', 'dropdown', 'radio', 'checkbox', 'multiselect', 'boolean', 'date']
  },
  options: [String],
  required: { type: Boolean, default: false }
}, { _id: false });

// 🧠 Final Product/Service Schema
const productServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  type: { type: String, enum: ['product', 'service'], required: true },

  description: String,
  price: Number,
  currency: { type: String, default: 'USD' },
  available: { type: Boolean, default: true },

  // 📸 Images
  images: [imageSchema],

  // 🎛️ Product-specific
  stock: Number,
  sku: String,
  variants: [variantSchema],

  // 💼 Service-specific
  schedule: [scheduleSchema],
  packages: [packageSchema],

  // Common
  tags: [String],
  categories: [String],
  features: [String],
  attributes: { type: Map, of: String },
  dynamicFields: [dynamicFieldSchema],
  metadata: mongoose.Schema.Types.Mixed,

  // 📦 Policies
  policies: {
    returnPolicy: String,
    refundPolicy: String,
    warranty: String,
    shipping: String,
    reschedulePolicy: String
  },

  // 🚩 Flags
  flags: {
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    limitedEdition: { type: Boolean, default: false },
    comingSoon: { type: Boolean, default: false }
  },

  // 🔗 Optional creator ref
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 📅 Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// 🔄 Update `updatedAt` automatically
productServiceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// 📊 Optional indexes for search
productServiceSchema.index({ name: 'text', tags: 'text', categories: 'text', description: 'text' });
productServiceSchema.index({ slug: 1 }, { unique: true });

// ✅ Export model
module.exports = mongoose.model('ProductService', productServiceSchema);
