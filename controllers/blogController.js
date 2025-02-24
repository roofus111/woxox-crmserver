const Blog = require('../models/Blog');

// @route   POST /posts
// @desc    Create a new post with an image
exports.createPost = async (req, res) => {
    try {
      const { title, content, excerpt, author, status, tags, seo } = req.body;
      const featuredImage = req.file ? `/uploads/${req.file.filename}` : '';
  
      const newPost = new Blog({
        title,
        slug: title.toLowerCase().split(' ').join('-'),
        content,
        excerpt,
        author,
        status,
        tags: tags ? tags.split(',') : [],
        seo,
        featuredImage
      });
  
      await newPost.save();
      res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  exports.getAllPosts = async (req, res) => {
    try {
      const posts = await Blog.find().populate('author', 'name email'); // Populate author details
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  exports.getPostById = async (req, res) => {
    try {
      const post = await Blog.findById(req.params.id).populate('author', 'name email');
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  exports.updatePost = async (req, res) => {
    try {
      const { title, content, excerpt, author, status, tags, seo } = req.body;
      const featuredImage = req.file ? `/uploads/${req.file.filename}` : req.body.featuredImage;
  
      const updatedPost = await Blog.findByIdAndUpdate(
        req.params.id,
        { title, slug: title.toLowerCase().split(' ').join('-'), content, excerpt, author, status, tags: tags ? tags.split(',') : [], seo, featuredImage },
        { new: true }
      );
     
      if (!updatedPost) return res.status(404).json({ success: false, message: 'Post not found' });
  
      res.status(200).json({ success: true, message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  exports.deletePost = async (req, res) => {
    try {
      const deletedPost = await Blog.findByIdAndDelete(req.params.id);
      if (!deletedPost) return res.status(404).json({ success: false, message: 'Post not found' });
  
      res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
 
  const path = require('path');
const fs = require('fs');

// @route   GET /images/:filename
// @desc    Fetch an image by filename
exports.getImage = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Image not found' });
  }
};