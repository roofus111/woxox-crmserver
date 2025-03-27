const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createcategory', CategoryController.createCategory);
router.get('/getcategories', CategoryController.getCategories);
router.get('/getcategory/:id', CategoryController.getCategoryById);
router.put('/updatecategory/:id', CategoryController.updateCategory);
router.delete('/deletecategory/:id', CategoryController.deleteCategory);

module.exports = router;
