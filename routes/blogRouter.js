const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload'); // Import upload middleware

// Create a post (with image upload)
router.post('/', upload.single('featuredImage'), blogController.createPost);
router.get('/get', blogController.getAllPosts);
router.get('/:id', blogController.getPostById);
router.put('/:id', upload.single('featuredImage'), blogController.updatePost);
router.delete('/:id', blogController.deletePost);
router.post('/uploads/:postId', upload.single('featuredImage'),blogController. addPostImage);
router.put('/uploads/:postId', upload.single('featuredImage'),blogController. updatePostImage);
router.get('/images/:filename', blogController.getImageByFilename);
router.delete('/uploads/:postId', blogController.deletePostImage);

module.exports = router;