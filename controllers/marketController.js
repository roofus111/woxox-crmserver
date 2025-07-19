const Marketplace = require('../models/Marketplace');
const slugify = require('slugify');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../config/s3');

// Create a new marketplace product
exports.createMarketplaceProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      subcategory,
      tags,
      pricing,
      company,
      features,
      images,
      videos,
      demoUrl,
      documentationUrl,
      integrations,
      supportedPlatforms,
      apiAvailable,
      sdkAvailable,
      languages,
      support,
      privacyPolicy,
      termsOfService,
      gdprCompliant,
      dataRetention
    } = req.body;

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and category are required'
      });
    }

    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });
    
    // Check if slug already exists
    const existingProduct = await Marketplace.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists'
      });
    }

    // Create new marketplace product
    const newProduct = new Marketplace({
      name,
      description,
      shortDescription,
      category,
      subcategory,
      tags,
      pricing,
      company,
      features,
      images,
      videos,
      demoUrl,
      documentationUrl,
      integrations,
      supportedPlatforms,
      apiAvailable,
      sdkAvailable,
      languages,
      support,
      privacyPolicy,
      termsOfService,
      gdprCompliant,
      dataRetention,
      slug,
      status: 'pending' // Default status
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Marketplace product created successfully',
      data: savedProduct
    });

  } catch (error) {
    console.error('Error creating marketplace product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating marketplace product',
      error: error.message
    });
  }
};

exports.getAllProducts = async (req, res) => {
    try {
      const products = await Marketplace.find();
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error retrieving products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products.',
        error: error.message
      });
    }
  };
  exports.getProductById = async (req, res) => {
    try {
      const product = await Marketplace.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.'
        });
      }
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
        console.error('Error retrieving product by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product.',
        error: error.message
      });
    }
  };
  exports.updateProduct = async (req, res) => {
    try {
      const product = await Marketplace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update product.',
        error: error.message
      });
    }
  };
  
  
exports.deleteProduct = async (req, res) => {
    try {
      const product = await Marketplace.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product.',
        error: error.message
      });
    }
  };
    
  
// Upload image for marketplace product
exports.uploadProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { isPrimary = false, isPremium = false, alt = '' } = req.body;

    // Validate product exists
    const product = await Marketplace.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if file exists
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload image to S3
    let imageUrl = null;
    try {
      const fileName = `${uuidv4()}-${req.file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `marketplace-images/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };

      const uploadResult = await s3.upload(params).promise();
      imageUrl = uploadResult.Location;
    } catch (uploadError) {
      console.error('Error uploading image to S3:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image to S3',
        error: uploadError.message
      });
    }

    // Create image object
    const newImage = {
      url: imageUrl,
      alt: alt,
      isPrimary: isPrimary,
      isPremium: isPremium
    };

    // If this is a primary image, unset other primary images
    if (isPrimary) {
      product.images.forEach(img => {
        img.isPrimary = false;
      });
    }

    // Add image to product
    product.images.push(newImage);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: newImage,
        productId: product._id
      }
    });

  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading product image',
      error: error.message
    });
  }
};

// Upload multiple images for marketplace product
exports.uploadMultipleImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { images } = req.body; // Array of image metadata

    // Validate product exists
    const product = await Marketplace.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const uploadedImages = [];

    // Upload each image to S3
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageMetadata = images && images[i] ? images[i] : {};
      const { isPrimary = false, isPremium = false, alt = '' } = imageMetadata;

      try {
        const fileName = `${uuidv4()}-${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `marketplace-images/${fileName}`,
          Body: file.buffer,
          ContentType: file.mimetype
        };

        const uploadResult = await s3.upload(params).promise();

        const newImage = {
          url: uploadResult.Location,
          alt: alt,
          isPrimary: isPrimary,
          isPremium: isPremium
        };

        // If this is a primary image, unset other primary images
        if (isPrimary) {
          product.images.forEach(img => {
            img.isPrimary = false;
          });
        }

        product.images.push(newImage);
        uploadedImages.push(newImage);

      } catch (uploadError) {
        console.error(`Error uploading image ${i + 1} to S3:`, uploadError);
        return res.status(500).json({
          success: false,
          message: `Error uploading image ${i + 1} to S3`,
          error: uploadError.message
        });
      }
    }

    await product.save();

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        images: uploadedImages,
        productId: product._id
      }
    });

  } catch (error) {
    console.error('Error uploading multiple product images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading multiple product images',
      error: error.message
    });
  }
};

// Delete product image
exports.deleteProductImage = async (req, res) => {
  try {
    const { productId, imageIndex } = req.params;

    // Validate product exists
    const product = await Marketplace.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate image index
    const imageIndexNum = parseInt(imageIndex);
    if (imageIndexNum < 0 || imageIndexNum >= product.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Get image URL for S3 deletion
    const imageToDelete = product.images[imageIndexNum];
    const imageUrl = imageToDelete.url;

    // Extract key from S3 URL for deletion
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(3).join('/'); // Remove https://bucket.s3.region.amazonaws.com/

    // Delete from S3
    try {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      };
      await s3.deleteObject(params).promise();
    } catch (s3Error) {
      console.error('Error deleting image from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Remove image from product
    product.images.splice(imageIndexNum, 1);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        productId: product._id,
        deletedImage: imageToDelete
      }
    });

  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product image',
      error: error.message
    });
  }
};

// Update image metadata (alt text, isPrimary, isPremium)
exports.updateImageMetadata = async (req, res) => {
  try {
    const { productId, imageIndex } = req.params;
    const { alt, isPrimary, isPremium } = req.body;

    // Validate product exists
    const product = await Marketplace.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate image index
    const imageIndexNum = parseInt(imageIndex);
    if (imageIndexNum < 0 || imageIndexNum >= product.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Update image metadata
    if (alt !== undefined) {
      product.images[imageIndexNum].alt = alt;
    }

    if (isPremium !== undefined) {
      product.images[imageIndexNum].isPremium = isPremium;
    }

    // Handle primary image logic
    if (isPrimary !== undefined) {
      if (isPrimary) {
        // Unset other primary images
        product.images.forEach((img, index) => {
          if (index !== imageIndexNum) {
            img.isPrimary = false;
          }
        });
      }
      product.images[imageIndexNum].isPrimary = isPrimary;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image metadata updated successfully',
      data: {
        image: product.images[imageIndexNum],
        productId: product._id
      }
    });

  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating image metadata',
      error: error.message
    });
  }
};
    
  