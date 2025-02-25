const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload'); // Import upload middleware
const mongoose = require('mongoose');

// Create a post (with image upload)
router.post('/', upload.single('featuredImage'), blogController.createPost);
router.get('/', blogController.getAllPosts);
router.get('/:id', blogController.getPostById);
router.put('/:id', upload.single('featuredImage'), blogController.updatePost);
router.delete('/:id', blogController.deletePost);
router.get('/:filename', blogController.getImage);
module.exports = router;