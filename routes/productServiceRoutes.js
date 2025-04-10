const express = require('express');
const router = express.Router();
const productServiceController = require('../controllers/productServiceController');
const authenticateUser = require('../middleware/authenticateUser');

router.use(authenticateUser);

router.post('/createproductservice', productServiceController.createProductService);
router.get('/getallproductservices', productServiceController.getAllProductServices);
router.get('/getproductservicebyid/:id', productServiceController.getProductServiceById);
router.put('/updateproductservice/:id', productServiceController.updateProductService);
router.delete('/deleteproductservice/:id', productServiceController.deleteProductService);

module.exports = router;