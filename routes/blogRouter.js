
/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the blog post
 *         slug:
 *           type: string
 *           description: URL-friendly version of the title
 *           unique: true
 *         content:
 *           type: string
 *           description: The main content of the blog post
 *         excerpt:
 *           type: string
 *           maxLength: 300
 *           description: Short summary for previews
 *         author:
 *           type: string
 *           format: uuid
 *           description: Reference to the User model
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tag strings
 *         featuredImage:
 *           type: string
 *           description: URL of the main image
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: draft
 *           description: Publication status of the blog post
 *         seo:
 *           type: object
 *           properties:
 *             metaTitle:
 *               type: string
 *               maxLength: 60
 *               description: Title for SEO purposes
 *             metaDescription:
 *               type: string
 *               maxLength: 160
 *               description: Description for SEO purposes
 *             keywords:
 *               type: array
 *               items:
 *                 type: string
 *               description: Keywords for SEO
 *         views:
 *           type: number
 *           default: 0
 *           description: Number of views
 *         likes:
 *           type: number
 *           default: 0
 *           description: Number of likes
 *         commentsEnabled:
 *           type: boolean
 *           default: true
 *           description: Whether comments are allowed
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: Publication timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         version:
 *           type: number
 *           default: 1
 *           description: Document version number
 *         relatedPosts:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of related blog post IDs
 */
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blog]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: featuredImage
 *         type: file
 *         description: Featured image for the blog post
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', upload.single('featuredImage'), blogController.createPost);

/**
 * @swagger
 * /api/blog/get:
 *   get:
 *     summary: Get all blog posts
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: List of all blog posts
 */
router.get('/get', blogController.getAllPosts);

/**
 * @swagger
 * /api/blog/{id}:
 *   get:
 *     summary: Get a blog post by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post found
 *       404:
 *         description: Blog post not found
 */
router.get('/:id', blogController.getPostById);

/**
 * @swagger
 * /api/blog/{id}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blog]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: featuredImage
 *         type: file
 *         description: Updated featured image
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       404:
 *         description: Blog post not found
 */
router.put('/:id', upload.single('featuredImage'), blogController.updatePost);

/**
 * @swagger
 * /api/blog/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       404:
 *         description: Blog post not found
 */
router.delete('/:id', blogController.deletePost);

/**
 * @swagger
 * /api/blog/uploads/{postId}:
 *   post:
 *     summary: Add an image to a blog post
 *     tags: [Blog]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: featuredImage
 *         type: file
 *         required: true
 *     responses:
 *       200:
 *         description: Image added successfully
 *       404:
 *         description: Blog post not found
 */
router.post('/uploads/:postId', upload.single('featuredImage'), blogController.addPostImage);

/**
 * @swagger
 * /api/blog/uploads/{postId}:
 *   put:
 *     summary: Update a blog post image
 *     tags: [Blog]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: featuredImage
 *         type: file
 *         required: true
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       404:
 *         description: Blog post not found
 */
router.put('/uploads/:postId', upload.single('featuredImage'), blogController.updatePostImage);

/**
 * @swagger
 * /api/blog/images/{filename}:
 *   get:
 *     summary: Get an image by filename
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image found
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 */
router.get('/images/:filename', blogController.getImageByFilename);

/**
 * @swagger
 * /api/blog/uploads/{postId}:
 *   delete:
 *     summary: Delete a blog post image
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Blog post or image not found
 */
router.delete('/uploads/:postId', blogController.deletePostImage);

module.exports = router;