const Blog = require('../models/Blog'); 
const User = require('../models/User'); 

// Create a new blog post
exports.createPost = async (req, res) => {
    try {
        const { title, content, categories, tags, coverImage, seoMeta, scheduledAt, language } = req.body;
        const newPost = new Blog({
            title,
            content,
            author: req.user._id, // Assuming user is authenticated
            categories,
            tags,
            coverImage,
            seoMeta,
            scheduledAt,
            language
        });

        await newPost.save();
        res.status(201).json({ success: true, message: "Blog post created!", data: newPost });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error creating post", error: error.message });
    }
};

// Get all published posts with pagination and search
exports.getAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { published: true, isDeleted: false };

        if (search) {
            query.$text = { $search: search }; // Uses full-text index
        }

        const posts = await Blog.find(query)
            .sort({ publishedAt: -1 }) // Latest posts first
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Blog.countDocuments(query);

        res.status(200).json({ success: true, data: posts, total, page, limit });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching posts", error: error.message });
    }
};

// Get a single post by slug
exports.getPostBySlug = async (req, res) => {
    try {
        const post = await Blog.findOne({ slug: req.params.slug, isDeleted: false }).populate('author', 'name');
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        await post.incrementViews(); // Increase view count
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching post", error: error.message });
    }
};

// Update a post (Only author can update)
exports.updatePost = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        Object.assign(post, req.body);
        await post.save();
        res.status(200).json({ success: true, message: "Post updated", data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating post", error: error.message });
    }
};

// Soft delete a post
exports.deletePost = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await post.softDelete();
        res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting post", error: error.message });
    }
};

// Restore a soft-deleted post
exports.restorePost = async (req, res) => {
    try {
        const post = await Blog.findOneWithDeleted({ _id: req.params.id, isDeleted: true });
        if (!post) return res.status(404).json({ success: false, message: "Post not found or not deleted" });

        await post.restore();
        res.status(200).json({ success: true, message: "Post restored", data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error restoring post", error: error.message });
    }
};

// Like or Unlike a post
exports.toggleLikePost = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        await post.toggleLike(req.user._id);
        res.status(200).json({ success: true, message: "Like status updated", data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error liking post", error: error.message });
    }
};

// Check if user liked post
exports.isPostLikedByUser = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const liked = post.isLikedByUser(req.user._id);
        res.status(200).json({ success: true, liked });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error checking like status", error: error.message });
    }
};

// Get related posts (AI-based NLP recommendation)
exports.getRelatedPosts = async (req, res) => {
    try {
        const relatedPosts = await Blog.findRelatedPosts(req.params.id);
        res.status(200).json({ success: true, data: relatedPosts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching related posts", error: error.message });
    }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
    try {
        const { content, parentComment } = req.body;
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const comment = {
            user: req.user._id,
            content,
            parentComment: parentComment || null
        };

        post.comments.push(comment);
        await post.save();
        res.status(201).json({ success: true, message: "Comment added", data: comment });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding comment", error: error.message });
    }
};

// Get comments of a post
exports.getComments = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id).populate('comments.user', 'name');
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        res.status(200).json({ success: true, data: post.comments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching comments", error: error.message });
    }
};
