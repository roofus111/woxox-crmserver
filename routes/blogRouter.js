const express = require('express');
const upload = require('../middleware/upload');
const router = express.Router();
const Posts = require('../controllers/blogController');

// Routes for posts
router.post('/createpost', upload.single('file'), Posts.createPost);
// router.get('/getpost', Posts.getPost);
// router.get('/getpostById/:id', Posts.getPostById);
// router.put('/updatepostById/:id', upload.single('file'), Posts.updatePost);
// router.delete('/deletepostById/:id', Posts.deletePost);
// router.get('/:filename', Posts.getImage);



const { protect, authorize } = require('../middleware/authMiddleware'); // Authentication Middleware


// Public Routes
router.get('/', getAllPosts); // Fetch all published posts
router.get('/:slug', getPostBySlug); // Fetch a single post by slug
router.get('/related/:id', getRelatedPosts); // Get AI-based related posts
router.get('/:id/comments', getComments); // Get comments for a post
router.get('/:id/liked', protect, isPostLikedByUser); // Check if user liked a post

// Protected Routes (User must be logged in)
router.post('/', protect, createPost); // Create a new post
router.put('/:id', protect, authorize('author', 'admin'), updatePost); // Update a post (only author or admin)
router.delete('/:id', protect, authorize('author', 'admin'), deletePost); // Soft delete a post
router.post('/:id/restore', protect, authorize('author', 'admin'), restorePost); // Restore a soft-deleted post
router.post('/:id/like', protect, toggleLikePost); // Like or unlike a post
router.post('/:id/comment', protect, addComment); // Add a comment to a post

module.exports = router;








