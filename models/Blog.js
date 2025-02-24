const mongoose = require('mongoose');


const BlogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  excerpt: { 
    type: String, 
    maxlength: 300 
  }, // Short summary for previews
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
//   categories: [{ 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Category' 
//   }], // Link to multiple categories
  tags: [{ 
    type: String 
  }], // Link to multiple tags
  featuredImage: { 
    type: String 
  }, // URL of the main image
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  }, // Publication status
  seo: {
    metaTitle: { 
      type: String, 
      maxlength: 60 
    }, // Title for SEO
    metaDescription: { 
      type: String, 
      maxlength: 160 
    }, // Description for SEO
    keywords: [String] // Keywords for SEO
  },
  views: { 
    type: Number, 
    default: 0 
  }, // Track views for analytics
  likes: { 
    type: Number, 
    default: 0 
  }, // Track likes for popularity
  commentsEnabled: { 
    type: Boolean, 
    default: true 
  }, // Allow/disable comments
  publishedAt: { 
    type: Date 
  }, // Publication timestamp
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  version: { 
    type: Number, 
    default: 1 
  }, // Increment with each update
  relatedPosts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  }] // Link to related posts
});

// Middleware to update timestamps and increment version
BlogSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isModified('content')) {
    this.version += 1;
  }
  next();
});

const Blog = mongoose.model('Blog', BlogSchema);
module.exports = Blog;
