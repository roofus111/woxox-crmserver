const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const authenticateUser = require('../middleware/authenticateUser');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Core CRUD Operations
router.post('/products', marketController.createMarketplaceProduct);
router.get('/getproducts', marketController.getAllProducts);
router.get('/getproduct/:id', marketController.getProductById);
router.put('/updateproduct/:id', marketController.updateProduct);
router.delete('/deleteproduct/:id', marketController.deleteProduct);


module.exports = router;
