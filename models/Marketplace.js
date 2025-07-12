const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  
  // Category and Classification
  category: {
    type: String,
    required: true,
    enum: [
      'AI & Automation',
      'Business & Finance', 
      'Design & Creative',
      'Development & IT',
      'Marketing & Sales',
      'Productivity & Communication',
      'Security & Compliance',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Pricing Information
  pricing: {
    type: {
      type: String,
      enum: ['free', 'freemium', 'paid', 'subscription', 'one-time', 'premium'],
      required: true
    },
    price: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    pricingModel: {
      type: String,
      enum: ['monthly', 'yearly', 'one-time', 'usage-based', 'tiered', 'premium']
    },
    freeTier: {
      available: {
        type: Boolean,
        default: false
      },
      description: String
    },
    // Premium-specific pricing
    premium: {
      isPremium: {
        type: Boolean,
        default: false
      },
      premiumPrice: {
        type: Number,
        min: 0
      },
      premiumCurrency: {
        type: String,
        default: 'USD'
      },
      premiumFeatures: [{
        name: String,
        description: String,
        value: String
      }],
      premiumBenefits: [String],
      premiumTrial: {
        available: {
          type: Boolean,
          default: false
        },
        duration: {
          type: Number, // days
          default: 14
        }
      },
      premiumSupport: {
        type: String,
        enum: ['basic', 'priority', 'dedicated', 'enterprise'],
        default: 'basic'
      }
    }
  },
  
  // Limited Offers and Promotions
  offers: [{
    id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['discount', 'free_trial', 'bonus', 'upgrade', 'early_bird', 'flash_sale', 'holiday', 'seasonal'],
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free_upgrade', 'bonus_feature'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number,
      required: true
    },
    offerPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    
    // Time-based constraints
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    
    // Usage limits
    maxUses: {
      type: Number,
      default: null // null means unlimited
    },
    currentUses: {
      type: Number,
      default: 0
    },
    maxUsesPerUser: {
      type: Number,
      default: 1
    },
    
    // Eligibility
    eligibility: {
      newUsersOnly: {
        type: Boolean,
        default: false
      },
      existingUsersOnly: {
        type: Boolean,
        default: false
      },
      premiumUsersOnly: {
        type: Boolean,
        default: false
      },
      minimumPurchase: {
        type: Number,
        default: 0
      },
      requiredProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marketplace'
      }],
      excludedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marketplace'
      }],
      userGroups: [String], // e.g., ['enterprise', 'startup', 'freelancer']
      countries: [String], // ISO country codes
      couponCode: {
        type: String,
        trim: true,
        uppercase: true
      }
    },
    
    // Display and visibility
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 0 // Higher number = higher priority
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    
    // Visual elements
    badge: {
      text: String,
      color: String,
      backgroundColor: String
    },
    banner: {
      text: String,
      image: String,
      backgroundColor: String
    },
    countdown: {
      enabled: {
        type: Boolean,
        default: true
      },
      showDays: {
        type: Boolean,
        default: true
      },
      showHours: {
        type: Boolean,
        default: true
      },
      showMinutes: {
        type: Boolean,
        default: true
      },
      showSeconds: {
        type: Boolean,
        default: true
      }
    },
    
    // Terms and conditions
    terms: [String],
    restrictions: [String],
    
    // Tracking and analytics
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    
    // Usage tracking
    usedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      usedAt: {
        type: Date,
        default: Date.now
      },
      orderId: String,
      amount: Number
    }],
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled'],
      default: 'draft'
    },
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    activatedAt: Date,
    expiredAt: Date
  }],
  
  // Company/Developer Information
  company: {
    name: {
      type: String,
      required: true
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL'
      }
    },
    logo: String,
    description: String,
    founded: Number,
    location: String,
    isPremiumPartner: {
      type: Boolean,
      default: false
    }
  },
  
  // Product Details
  features: [{
    name: String,
    description: String,
    isPremium: {
      type: Boolean,
      default: false
    }
  }],
  
  // Media and Assets
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: String,
    title: String,
    description: String,
    isPremium: {
      type: Boolean,
      default: false
    }
  }],
  demoUrl: String,
  documentationUrl: String,
  premiumDemoUrl: String,
  
  // Technical Information
  integrations: [{
    name: String,
    description: String,
    url: String,
    isPremium: {
      type: Boolean,
      default: false
    }
  }],
  supportedPlatforms: [{
    type: String,
    enum: ['web', 'mobile', 'desktop', 'api', 'plugin']
  }],
  apiAvailable: {
    type: Boolean,
    default: false
  },
  sdkAvailable: {
    type: Boolean,
    default: false
  },
  premiumApiAccess: {
    type: Boolean,
    default: false
  },
  
  // Ratings and Reviews
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    premiumRating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    title: String,
    comment: String,
    pros: [String],
    cons: [String],
    date: {
      type: Date,
      default: Date.now
    },
    helpful: {
      type: Number,
      default: 0
    },
    isPremiumUser: {
      type: Boolean,
      default: false
    },
    premiumExperience: {
      type: Boolean,
      default: false
    }
  }],
  
  // Usage Statistics
  stats: {
    downloads: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    installations: {
      type: Number,
      default: 0
    },
    premiumSubscriptions: {
      type: Number,
      default: 0
    },
    premiumConversionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    offerRevenue: {
      type: Number,
      default: 0
    },
    offerConversions: {
      type: Number,
      default: 0
    }
  },
  
  // Status and Moderation
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumBadge: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'platinum'],
    default: 'none'
  },
  
  // SEO and Discovery
  slug: {
    type: String,
    unique: true,
    required: true
  },
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: Date,
  premiumLaunchDate: Date,
  
  // Additional Information
  languages: [{
    type: String,
    default: ['English']
  }],
  support: {
    email: String,
    phone: String,
    chat: Boolean,
    documentation: Boolean,
    community: Boolean,
    premiumSupport: {
      available: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['priority', 'dedicated', 'enterprise'],
        default: 'priority'
      },
      responseTime: String, // e.g., "2 hours", "24 hours"
      channels: [{
        type: String,
        enum: ['email', 'phone', 'chat', 'video', 'onsite']
      }]
    }
  },
  
  // Legal and Compliance
  privacyPolicy: String,
  termsOfService: String,
  gdprCompliant: {
    type: Boolean,
    default: false
  },
  dataRetention: String,
  
  // Analytics and Tracking
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  premiumViews: {
    type: Number,
    default: 0
  },
  premiumClicks: {
    type: Number,
    default: 0
  },
  
  // Premium-specific features
  premiumFeatures: {
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    priorityUpdates: {
      type: Boolean,
      default: false
    },
    dedicatedAccountManager: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    },
    sslCertificates: {
      type: Boolean,
      default: false
    },
    backupServices: {
      type: Boolean,
      default: false
    },
    performanceOptimization: {
      type: Boolean,
      default: false
    },
    unlimitedUsage: {
      type: Boolean,
      default: false
    }
  },
  
  // Premium tiers
  premiumTiers: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    features: [String],
    maxUsers: Number,
    storage: String, // e.g., "100GB", "Unlimited"
    apiCalls: String, // e.g., "10,000/month", "Unlimited"
    support: {
      type: String,
      enum: ['email', 'priority', 'dedicated', 'enterprise']
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isRecommended: {
      type: Boolean,
      default: false
    }
  }],
  
  // Premium comparison
  premiumComparison: {
    freeVsPremium: [{
      feature: String,
      free: String,
      premium: String
    }],
    benefits: [String],
    testimonials: [{
      name: String,
      company: String,
      role: String,
      testimonial: String,
      rating: Number,
      isVerified: {
        type: Boolean,
        default: false
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
marketplaceSchema.index({ category: 1, status: 1 });
marketplaceSchema.index({ 'pricing.type': 1, status: 1 });
marketplaceSchema.index({ rating: -1, status: 1 });
marketplaceSchema.index({ isFeatured: 1, status: 1 });
marketplaceSchema.index({ isPremium: 1, status: 1 });
marketplaceSchema.index({ premiumBadge: 1, status: 1 });
marketplaceSchema.index({ slug: 1 });
marketplaceSchema.index({ tags: 1 });
marketplaceSchema.index({ 'company.name': 1 });
marketplaceSchema.index({ 'offers.startDate': 1, 'offers.endDate': 1 });
marketplaceSchema.index({ 'offers.status': 1, 'offers.isActive': 1 });
marketplaceSchema.index({ 'offers.couponCode': 1 });

// Virtual for full pricing display
marketplaceSchema.virtual('pricingDisplay').get(function() {
  if (this.pricing.type === 'free') {
    return 'Free';
  } else if (this.pricing.type === 'premium') {
    return `Premium from ${this.pricing.premium.premiumCurrency} ${this.pricing.premium.premiumPrice}`;
  } else if (this.pricing.price === 0) {
    return 'Free';
  } else {
    return `${this.pricing.currency} ${this.pricing.price}`;
  }
});

// Virtual for premium pricing display
marketplaceSchema.virtual('premiumPricingDisplay').get(function() {
  if (this.premiumTiers && this.premiumTiers.length > 0) {
    const baseTier = this.premiumTiers.find(tier => tier.isRecommended) || this.premiumTiers[0];
    return `${baseTier.currency} ${baseTier.price}/${baseTier.billingCycle}`;
  }
  return null;
});

// Virtual for average rating display
marketplaceSchema.virtual('ratingDisplay').get(function() {
  return this.rating.average.toFixed(1);
});

// Virtual for premium rating display
marketplaceSchema.virtual('premiumRatingDisplay').get(function() {
  return this.rating.premiumRating.average.toFixed(1);
});

// Virtual for conversion rate display
marketplaceSchema.virtual('conversionRateDisplay').get(function() {
  return `${this.stats.premiumConversionRate.toFixed(1)}%`;
});

// Virtual for active offers
marketplaceSchema.virtual('activeOffers').get(function() {
  const now = new Date();
  return this.offers.filter(offer => 
    offer.isActive && 
    offer.status === 'active' &&
    offer.startDate <= now && 
    offer.endDate >= now &&
    (!offer.maxUses || offer.currentUses < offer.maxUses)
  ).sort((a, b) => b.priority - a.priority);
});

// Virtual for best offer
marketplaceSchema.virtual('bestOffer').get(function() {
  const activeOffers = this.activeOffers;
  if (activeOffers.length === 0) return null;
  
  // Sort by discount percentage (highest first)
  return activeOffers.sort((a, b) => {
    const aDiscount = ((a.originalPrice - a.offerPrice) / a.originalPrice) * 100;
    const bDiscount = ((b.originalPrice - b.offerPrice) / b.originalPrice) * 100;
    return bDiscount - aDiscount;
  })[0];
});

// Virtual for time remaining in best offer
marketplaceSchema.virtual('offerTimeRemaining').get(function() {
  const bestOffer = this.bestOffer;
  if (!bestOffer) return null;
  
  const now = new Date();
  const endDate = new Date(bestOffer.endDate);
  const timeRemaining = endDate - now;
  
  if (timeRemaining <= 0) return null;
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: timeRemaining };
});

// Pre-save middleware to update timestamps
marketplaceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find featured products
marketplaceSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true, 
    status: 'approved' 
  }).sort({ rating: -1 });
};

// Static method to find products with active offers
marketplaceSchema.statics.findWithOffers = function() {
  const now = new Date();
  return this.find({
    'offers': {
      $elemMatch: {
        isActive: true,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      }
    },
    status: 'approved'
  }).sort({ 'offers.priority': -1 });
};

// Static method to find flash sales
marketplaceSchema.statics.findFlashSales = function() {
  const now = new Date();
  return this.find({
    'offers': {
      $elemMatch: {
        type: 'flash_sale',
        isActive: true,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      }
    },
    status: 'approved'
  }).sort({ 'offers.endDate': 1 });
};

// Static method to find premium products
marketplaceSchema.statics.findPremium = function() {
  return this.find({ 
    isPremium: true, 
    status: 'approved' 
  }).sort({ 'rating.premiumRating.average': -1 });
};

// Static method to find by category
marketplaceSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category, 
    status: 'approved' 
  }).sort({ rating: -1 });
};

// Static method to find premium products by category
marketplaceSchema.statics.findPremiumByCategory = function(category) {
  return this.find({ 
    category: category, 
    isPremium: true,
    status: 'approved' 
  }).sort({ 'rating.premiumRating.average': -1 });
};

// Instance method to increment views
marketplaceSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to increment premium views
marketplaceSchema.methods.incrementPremiumViews = function() {
  this.premiumViews += 1;
  return this.save();
};

// Instance method to add review
marketplaceSchema.methods.addReview = function(review) {
  this.reviews.push(review);
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  // Recalculate premium rating if review is from premium user
  if (review.isPremiumUser) {
    const premiumReviews = this.reviews.filter(r => r.isPremiumUser);
    const totalPremiumRating = premiumReviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating.premiumRating.average = totalPremiumRating / premiumReviews.length;
    this.rating.premiumRating.count = premiumReviews.length;
  }
  
  return this.save();
};

// Instance method to calculate premium conversion rate
marketplaceSchema.methods.calculateConversionRate = function() {
  if (this.stats.installations > 0) {
    this.stats.premiumConversionRate = (this.stats.premiumSubscriptions / this.stats.installations) * 100;
  }
  return this.save();
};

// Instance method to add premium tier
marketplaceSchema.methods.addPremiumTier = function(tier) {
  this.premiumTiers.push(tier);
  this.isPremium = true;
  return this.save();
};

// Instance method to update premium badge
marketplaceSchema.methods.updatePremiumBadge = function(badge) {
  this.premiumBadge = badge;
  return this.save();
};

// Instance method to add offer
marketplaceSchema.methods.addOffer = function(offer) {
  // Generate unique offer ID
  offer.id = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.offers.push(offer);
  return this.save();
};

// Instance method to update offer
marketplaceSchema.methods.updateOffer = function(offerId, updates) {
  const offerIndex = this.offers.findIndex(offer => offer.id === offerId);
  if (offerIndex !== -1) {
    this.offers[offerIndex] = { ...this.offers[offerIndex].toObject(), ...updates };
    this.offers[offerIndex].updatedAt = new Date();
  }
  return this.save();
};

// Instance method to remove offer
marketplaceSchema.methods.removeOffer = function(offerId) {
  this.offers = this.offers.filter(offer => offer.id !== offerId);
  return this.save();
};

// Instance method to use offer
marketplaceSchema.methods.useOffer = function(offerId, userId, orderId, amount) {
  const offer = this.offers.find(o => o.id === offerId);
  if (!offer) {
    throw new Error('Offer not found');
  }
  
  // Check if offer is still valid
  const now = new Date();
  if (!offer.isActive || 
      offer.status !== 'active' || 
      offer.startDate > now || 
      offer.endDate < now) {
    throw new Error('Offer is not active');
  }
  
  // Check usage limits
  if (offer.maxUses && offer.currentUses >= offer.maxUses) {
    throw new Error('Offer usage limit reached');
  }
  
  // Check if user has already used this offer
  const userUsageCount = offer.usedBy.filter(usage => 
    usage.userId.toString() === userId.toString()
  ).length;
  
  if (userUsageCount >= offer.maxUsesPerUser) {
    throw new Error('User has already used this offer maximum times');
  }
  
  // Add usage record
  offer.usedBy.push({
    userId,
    usedAt: new Date(),
    orderId,
    amount
  });
  
  // Update counters
  offer.currentUses += 1;
  offer.conversions += 1;
  offer.revenue += amount;
  
  // Update product stats
  this.stats.offerConversions += 1;
  this.stats.offerRevenue += amount;
  
  return this.save();
};

// Instance method to validate coupon code
marketplaceSchema.methods.validateCoupon = function(couponCode, userId, userData = {}) {
  const offer = this.offers.find(o => 
    o.isActive && 
    o.status === 'active' && 
    o.eligibility.couponCode === couponCode.toUpperCase()
  );
  
  if (!offer) {
    return { valid: false, message: 'Invalid coupon code' };
  }
  
  // Check time validity
  const now = new Date();
  if (offer.startDate > now || offer.endDate < now) {
    return { valid: false, message: 'Coupon has expired or not yet active' };
  }
  
  // Check usage limits
  if (offer.maxUses && offer.currentUses >= offer.maxUses) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // Check user eligibility
  if (offer.eligibility.newUsersOnly && userData.isExistingUser) {
    return { valid: false, message: 'Coupon is for new users only' };
  }
  
  if (offer.eligibility.existingUsersOnly && !userData.isExistingUser) {
    return { valid: false, message: 'Coupon is for existing users only' };
  }
  
  if (offer.eligibility.premiumUsersOnly && !userData.isPremiumUser) {
    return { valid: false, message: 'Coupon is for premium users only' };
  }
  
  // Check if user has already used this offer
  const userUsageCount = offer.usedBy.filter(usage => 
    usage.userId.toString() === userId.toString()
  ).length;
  
  if (userUsageCount >= offer.maxUsesPerUser) {
    return { valid: false, message: 'You have already used this coupon maximum times' };
  }
  
  return { 
    valid: true, 
    offer: offer,
    discountAmount: offer.originalPrice - offer.offerPrice,
    discountPercentage: ((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100
  };
};

// Instance method to get offer analytics
marketplaceSchema.methods.getOfferAnalytics = function(offerId) {
  const offer = this.offers.find(o => o.id === offerId);
  if (!offer) return null;
  
  const conversionRate = offer.views > 0 ? (offer.conversions / offer.views) * 100 : 0;
  const revenuePerView = offer.views > 0 ? offer.revenue / offer.views : 0;
  const averageOrderValue = offer.conversions > 0 ? offer.revenue / offer.conversions : 0;
  
  return {
    offer,
    conversionRate: conversionRate.toFixed(2),
    revenuePerView: revenuePerView.toFixed(2),
    averageOrderValue: averageOrderValue.toFixed(2),
    remainingUses: offer.maxUses ? offer.maxUses - offer.currentUses : 'Unlimited',
    timeRemaining: offer.endDate - new Date()
  };
};  

const Marketplace = mongoose.model('Marketplace', marketplaceSchema);

module.exports = Marketplace;