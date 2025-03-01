const slugify = require('slugify');
const Blog = require('../models/Blog'); // Ensure correct model import

exports.createPost = async (req, res) => {
  try {
    const { title, content, excerpt,  status, tags, seo } = req.body;
    const featuredImage = req.file ? req.file.filename  : '';

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title, content, and author are required' });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existingPost = await Blog.findOne({ slug });
    if (existingPost) {
      return res.status(400).json({ success: false, message: 'A post with this title already exists' });
    }

    const relatedPosts = await Blog.find({ 
      tags: { $in: tags }, 
      _id: { $ne: existingPost?._id } // Exclude the current post
    }).limit(5);

    const newPost = new Blog({
      title,
      slug,
      content,
      excerpt,
      // author,
      status,
      tags, // Directly using tags as received from frontend
      seo,
      featuredImage,
      relatedPosts: relatedPosts.map(post => post._id),
    });

    await newPost.save();
    res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
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
  // exports.getPostById = async (req, res) => {
  //   try {
  //     const post = await Blog.findById(req.params.id).populate('author', 'name email');
  //     if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  //     res.status(200).json(post);
  //   } catch (error) {
  //     res.status(500).json({ success: false, message: error.message });
  //   }
  // };
  exports.updatePost = async (req, res) => {
    try {
      const { id } = req.params; // Get post ID from URL params
      const { title, content, excerpt, status, tags, seo } = req.body;
      const featuredImage = req.file ? req.file.filename : null;
      // Handle new image upload
  
      // Find the post by ID
      const post = await Blog.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
  
      // Update slug if the title changes
      if (title && title !== post.title) {
        post.slug = slugify(title, { lower: true, strict: true });
  
        // Ensure slug is unique
        const existingPost = await Blog.findOne({ slug: post.slug, _id: { $ne: id } });
        if (existingPost) {
          return res.status(400).json({ success: false, message: 'A post with this title already exists' });
        }
      }
  
      // Ensure tags is always an array
      const tagsArray = Array.isArray(tags) ? tags : post.tags;
  
      // Generate excerpt if not provided
      post.excerpt = excerpt || content?.substring(0, 300) + '...';
  
      // Update related posts based on new tags
      if (tagsArray.length > 0) {
        const relatedPosts = await Blog.find({
          tags: { $in: tagsArray },
          _id: { $ne: post._id }
        }).limit(5);
        post.relatedPosts = relatedPosts.map(p => p._id);
      }
  
      // Update the `publishedAt` field when transitioning to `published`
      if (status && status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
  
      // Apply updates
      post.title = title || post.title;
      post.content = content || post.content;
      post.status = status || post.status;
      post.tags = tagsArray;
      post.seo = seo || post.seo;
      post.featuredImage = featuredImage || post.featuredImage;
      post.updatedAt = new Date();
      post.version += 1; // Increment version
  
      await post.save();
  
      res.status(200).json({ success: true, message: 'Post updated successfully', post });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error.message
      });
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
 

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params; // Extract post ID from request parameters

    // Validate ID presence
    if (!id) {
      return res.status(400).json({ message: 'Post ID is required.' });
    }

    // Fetch the post by ID
    const post = await Blog.find({slug:id})
      .populate('tags', 'name') // Populate tag names
      .populate('author', 'name email') // Populate author name and email
      .exec();

    // If post is not found, return 404
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Respond with the post details
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error.message);
    res.status(500).json({
      message: 'An error occurred while fetching the post.',
      error: error.message,
    });
  }
};
exports.updatePostImage = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const featuredImage = req.file.filename;

    const updatedPost = await Blog.findByIdAndUpdate(
      postId,
      { featuredImage },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, message: 'Image updated successfully', post: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};



exports.addPostImage = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const featuredImage = req.file.filename; // Store only the filename as a strin // Store as an object

    const post = await Blog.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.featuredImage) {
      return res.status(400).json({ success: false, message: 'Post already has an image. Use update instead.' });
    }

    post.featuredImage = featuredImage;
    await post.save();

    res.status(200).json({ success: true, message: 'Image added successfully', post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const path = require('path');

exports.getImageByFilename = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename is required' });
    }

    // Construct the full image path (adjust based on your storage path)
    const imagePath = path.join(__dirname, '../uploads/images/', filename);

    // Send the file
    res.sendFile(imagePath, (err) => {
      if (err) {
        res.status(404).json({ success: false, message: 'Image not found' });
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
const fs = require('fs');

exports.deletePostImage = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate postId
    if (!postId) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    const post = await Blog.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!post.featuredImage) {
      return res.status(400).json({ success: false, message: 'No image found for this post' });
    }

    // Construct the full image path
    const imagePath = path.join(__dirname, '../uploads/', post.featuredImage);

    // Delete the image file
    fs.unlink(imagePath, async (err) => {
      if (err && err.code !== 'ENOENT') {
        return res.status(500).json({ success: false, message: 'Error deleting image', error: err.message });
      }

      // Remove the image reference from the post
      post.featuredImage = null;
      await post.save();

      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

