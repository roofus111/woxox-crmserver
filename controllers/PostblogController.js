const Post = require('../models/Postblog');
// const Category = require('../models/Category');
// const Tag = require('../models/Tag');
const fs = require('fs');
const path = require('path');

// Image upload handler
// exports.uploadImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded.' });
//     }

//     const imagePath = path.join('uploads/images', req.file.filename);
//     res.status(200).json({
//       message: 'Image uploaded successfully.',
//       imagePath,
//     });
//   } catch (error) {
//     console.error('Error uploading image:', error.message);
//     res.status(500).json({
//       message: 'An error occurred while uploading the image.',
//       error: error.message,
//     });
//   }
// };


exports.createPost = async (req, res) => {
  try {
    const { title, slug, content, author, categories = [],relatedPosts, tags, seo } = JSON.parse(req.body.formData);
    const featuredImage = req.file ?  req.file.filename : null;

    if (!title || !slug || !content || !author) {
      return res.status(400).json({ message: 'Title, slug, content, and author are required.' });
    }

    // Validate categories
    if (categories.length > 0) {
      const validCategories = await Category.find({ _id: { $in: categories } });
      if (validCategories.length !== categories.length) {
        return res.status(400).json({ message: 'Invalid categories provided.' });
      }
    }

    // Validate tags
    // if (tags.length > 0) {
    //   const validTags = await Tag.find({ _id: { $in: tags } });
    //   if (validTags.length !== tags.length) {
    //     return res.status(400).json({ message: 'Invalid tags provided.' });
    //   }
    // }

    const post = new Post({
      title,
      slug,
      content,
      author,
      categories,
      tags,
      featuredImage: featuredImage,
      seo,relatedPosts // Add image to the post
    });
// console.log(post)
    const savedPost = await post.save();
    console.log(savedPost);
    
    res.status(201).json({
      message: 'Post created successfully.',
      post: savedPost,
    });
  } catch (error) {
    console.error('Error creating post:', error.message);
    res.status(500).json({
      message: 'An error occurred while creating the post.',
      error: error.message,
    });
  }
};

// Controller to get posts
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from request parameters

    // If ID is provided, fetch a specific post
    if (id) {
      const post = await Post.findById(id)
        .populate('categories', 'name') // Populate category names
        .populate('tags', 'name') // Populate tag names
        .populate('author', 'name email') // Populate author name and email
        .exec();

      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      return res.status(200).json(post);
    }

    // If no ID is provided, fetch all posts
    const posts = await Post.find()
      .populate('categories', 'name') // Populate category names
      .populate('tags', 'name') // Populate tag names
      .populate('author', 'name email') // Populate author name and email
      .exec();

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).json({
      message: 'An error occurred while fetching posts.',
      error: error.message,
    });
  }
};

// Controller to get a post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params; // Extract post ID from request parameters

    // Validate ID presence
    if (!id) {
      return res.status(400).json({ message: 'Post ID is required.' });
    }

    // Fetch the post by ID
    const post = await Post.findById(id)
      // .populate('categories', 'name') // Populate category names
      // .populate('tags', 'name') // Populate tag names
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


// Controller to update a post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params; // Extract post ID from the request parameters
    const { 
      title, 
      slug, 
      content, 
      excerpt, 
      author, 
      // categories, 
      // tags, 
      featuredImage, 
      status, 
      seo, 
      commentsEnabled 
    } = req.body;
    console.log(req.body);
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({ message: 'Post ID is required.' });
    }

    // Validate if the post exists
    const post = await Post.findByIdAndUpdate(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // // Validate categories if provided
    // if (categories && categories.length) {
    //   const validCategories = await Category.find({ _id: { $in: categories } });
    //   if (validCategories.length !== categories.length) {
    //     return res.status(400).json({ message: 'Invalid categories provided.' });
    //   }
    // }

    // // Validate tags if provided
    // if (tags && !Array.isArray(tags)) {
    //   return res.status(400).json({ message: 'Tags should be an array of strings.' });
    // }
    

    // Update the post with the new values
    post.title = title || post.title;
    post.slug = slug || post.slug;
    post.content = content || post.content;
    post.excerpt = excerpt || post.excerpt;
    post.author = author || post.author;
    // post.categories = categories || post.categories;
    // post.tags = tags || post.tags;
    post.status = status || post.status;
    post.seo = seo || post.seo;
    post.featuredImage = featuredImage !== undefined ? featuredImage : post.featuredImage; // Update image if provided
    post.commentsEnabled = commentsEnabled !== undefined ? commentsEnabled : post.commentsEnabled;
    post.updatedAt = new Date(); // Update the `updatedAt` field

    // Save the updated post to the database
    const updatedPost = await post.save();

    // Respond with the updated post
    res.status(200).json({
      message: 'Post updated successfully.',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error updating post:', error.message);
    res.status(500).json({
      message: 'An error occurred while updating the post.',
      error: error.message,
    });
  }
};

// Controller to delete a post by ID
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params; // Extract the post ID from the URL parameters

    // Validate if the ID is provided
    if (!id) {
      return res.status(400).json({ message: 'Post ID is required.' });
    }

    // Find the post by ID and delete it
    const post = await Post.findByIdAndDelete(id);

    // Check if the post was found and deleted
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Respond with a success message
    res.status(200).json({
      message: 'Post deleted successfully.',
      postId: id,
    });
  } catch (error) {
    console.error('Error deleting post:', error.message);
    res.status(500).json({
      message: 'An error occurred while deleting the post.',
      error: error.message,
    });
  }
};



// Controller to serve images by filename
exports.getImage = (req, res) => {
  const filename = req.params.filename; // Extract filename from the request
  const filepath = path.join(__dirname, '../uploads/images', filename); // Adjust path as needed

  // Check if the file exists
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath); // Serve the image file
  } else {
    res.status(404).json({ message: 'Image not found.' }); // Send a 404 error if file doesn't exist
  }
};



