const express = require('express');
const upload = require('../middleware/upload');
const router = express.Router();
const Postblog = require('../controllers/PostblogController'); // Import the whole module

// Route to handle creating a new category
// router.post('/createpost', Post.createPost);
// Routes for posts
router.post('/create-post', upload.single('file'), Postblog.createPost);
router.put('/update-post/:id', upload.single('featuredImage'), Postblog.updatePost);
// Route for image upload
// router.post('/upload-image', upload.single('image'), Post.uploadImage);
router.get('/getpost', Postblog.getPost);
router.get('/getpostById/:id', Postblog.getPostById);
router.put('/updatepostById/:id', Postblog.updatePost);
router.delete('/deletepostById/:id', Postblog.deletePost);
router.get('/:filename', Postblog.getImage);

module.exports = router;









