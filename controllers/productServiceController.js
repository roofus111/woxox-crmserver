const ProductService = require('../models/productService');

exports.createProductService = async (req, res) => {
  try {
    const productService = new ProductService(req.body);
    await productService.save();

    res.status(201).json({
      success: true,
      message: 'Product/Service created successfully.',
      data: productService
    });
  } catch (error) {
    console.error('Error creating product/service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create product/service.',
      error: error.message
    });
  }
};

exports.getAllProductServices = async (req, res) => {
    try {
      const productServices = await ProductService.find();
      res.status(200).json({
        success: true,
        data: productServices
      });
    } catch (error) {
      console.error('Error retrieving product/services:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product/services.',
        error: error.message
      });
    }
  };
  
  exports.getProductServiceById = async (req, res) => {
    try {
      const productService = await ProductService.findById(req.params.id);
      if (!productService) {
        return res.status(404).json({
          success: false,
          message: 'Product/Service not found.'
        });
      }
      res.status(200).json({
        success: true,
        data: productService
      });
    } catch (error) {
      console.error('Error retrieving product/service by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product/service.',
        error: error.message
      });
    }
  };
  
exports.updateProductService = async (req, res) => {
  try {
    const productService = await ProductService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!productService) {
      return res.status(404).json({
        success: false,
        message: 'Product/Service not found.'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Product/Service updated successfully.',
      data: productService
    });
  } catch (error) {
    console.error('Error updating product/service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update product/service.',
      error: error.message
    });
  }
};

exports.deleteProductService = async (req, res) => {
  try {
    const productService = await ProductService.findByIdAndDelete(req.params.id);
    if (!productService) {
      return res.status(404).json({
        success: false,
        message: 'Product/Service not found.'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Product/Service deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting product/service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product/service.',
      error: error.message
    });
  }
};
  
