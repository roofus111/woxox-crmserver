const express = require('express');
const upload = require('../middleware/upload');
const router = express.Router();
const Posts = require('../controllers/PostblogController');

// Routes for posts
router.post('/createpost', upload.single('file'), Posts.createPost);
// router.get('/getpost', Posts.getPost);
// router.get('/getpostById/:id', Posts.getPostById);
// router.put('/updatepostById/:id', upload.single('file'), Posts.updatePost);
// router.delete('/deletepostById/:id', Posts.deletePost);
// router.get('/:filename', Posts.getImage);

module.exports = router;









