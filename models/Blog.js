const mongoose = require('mongoose');
const slugify = require('slugify');
const shortid = require('shortid');
const mongooseDelete = require('mongoose-delete');
const natural = require('natural');

// Comment Schema (Supports Nested Replies & Likes)
const CommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the comment
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Blog Schema
const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    shortUrl: { type: String, unique: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categories: [{ type: String, index: true }],
    tags: [{ type: String, index: true }],
    coverImage: { type: String }, 
    seoMeta: { // SEO metadata for search engines
        title: { type: String },
        description: { type: String },
        keywords: [{ type: String }]
    },
    comments: [CommentSchema], 
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the post
    views: { type: Number, default: 0 },
    readTime: { type: Number, default: 0 }, // Estimated read time
    shares: { 
        twitter: { type: Number, default: 0 },
        facebook: { type: Number, default: 0 },
        linkedin: { type: Number, default: 0 }
    },
    relatedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }], // AI-based related posts
    published: { type: Boolean, default: false },
    draft: { type: Boolean, default: false }, // Drafting support
    publishedAt: { type: Date },
    scheduledAt: { type: Date }, // Scheduled publishing
    isArchived: { type: Boolean, default: false }, 
    isDeleted: { type: Boolean, default: false }, 
    language: { type: String, enum: ['en', 'es', 'fr', 'de', 'zh'], default: 'en' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Middleware: Auto-generate slug & short URL
BlogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = slugify(this.title, { lower: true, strict: true });
        this.shortUrl = shortid.generate();
    }
    if (this.published && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Virtual Fields
BlogSchema.virtual('likeCount').get(function() { return this.likes.length; });
BlogSchema.virtual('commentCount').get(function() { return this.comments.length; });

// Full-Text Search Index (Supports SEO)
BlogSchema.index({ title: 'text', content: 'text', tags: 'text', 'seoMeta.description': 'text' });

// Auto-Archive Middleware (Archives posts older than 1 year)
BlogSchema.post('save', async function(doc) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (doc.publishedAt && doc.publishedAt < oneYearAgo) {
        doc.isArchived = true;
        await doc.save();
    }
});

// Increment Views Method
BlogSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Read Time Calculation
BlogSchema.methods.calculateReadTime = function() {
    const wordsPerMinute = 200;
    const words = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(words / wordsPerMinute);
    return this.save();
};

// Soft Delete Method
BlogSchema.methods.softDelete = function() {
    this.isDeleted = true;
    return this.save();
};

// Restore Soft Deleted Blog
BlogSchema.methods.restore = function() {
    this.isDeleted = false;
    return this.save();
};

// AI-Based Related Posts (Uses NLP)
BlogSchema.statics.findRelatedPosts = async function(blogId) {
    const blog = await this.findById(blogId);
    if (!blog) return [];

    // Find posts by tags & categories
    let relatedPosts = await this.find({
        _id: { $ne: blog._id },
        isDeleted: false,
        $or: [
            { categories: { $in: blog.categories } },
            { tags: { $in: blog.tags } }
        ]
    });

    // Use NLP to score related posts by content similarity
    const tokenizer = new natural.WordTokenizer();
    const blogWords = tokenizer.tokenize(blog.content.toLowerCase());

    relatedPosts = relatedPosts
        .map(post => {
            const postWords = tokenizer.tokenize(post.content.toLowerCase());
            const commonWords = blogWords.filter(word => postWords.includes(word));
            return { post, score: commonWords.length };
        })
        .sort((a, b) => b.score - a.score) // Sort by similarity
        .slice(0, 5) // Limit to 5 results
        .map(entry => entry.post);

    return relatedPosts;
};

// Scheduled Publishing Middleware
BlogSchema.pre('save', function(next) {
    if (this.scheduledAt && this.scheduledAt <= new Date()) {
        this.published = true;
        this.publishedAt = new Date();
    }
    next();
});

// Like & Unlike a Post
BlogSchema.methods.toggleLike = async function(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
        this.likes.push(userId);
    } else {
        this.likes.splice(index, 1);
    }
    return this.save();
};

// Check if User Liked Post
BlogSchema.methods.isLikedByUser = function(userId) {
    return this.likes.includes(userId);
};

// Soft Delete Plugin
BlogSchema.plugin(mongooseDelete, { overrideMethods: 'all', deletedAt: true });

const Blog = mongoose.model('Blog', BlogSchema);

module.exports = Blog;
