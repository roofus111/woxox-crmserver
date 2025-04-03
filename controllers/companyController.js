const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { S3 } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");
const Company = require('../models/Company');
const User = require('../models/User');
const multer = require('multer');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Get the authenticated user's company
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find(); // Fetch all companies from the database

    if (!companies || companies.length === 0) {
      return res.status(404).json({ message: 'No companies found' });
    }

    res.status(200).json(companies); // Return all companies
  } catch (err) {
    console.error(err); // Optional logging
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new company with a profile image
exports.createCompany = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, website, phone, email, industry, employees, street, city, state, country, postalCode } = req.body;


    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Company name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if the company already exists
    const existingCompany = await Company.findOne({ email }).session(session);
    if (existingCompany) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // Handle profile image upload to S3
    let profileImage = null;
    
    if (req.file && req.file.buffer) {
      try {
        const fileName = `${uuidv4()}-${req.file.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `company-images/${fileName}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        };


        const uploadResult = await s3.upload(params).promise();


        profileImage = {
          fileName: fileName,
          fileType: req.file.mimetype,
          fileUrl: uploadResult.Location
        };
      } catch (uploadError) {
        console.error('Error uploading file to S3:', uploadError);
        await session.abortTransaction();
        return res.status(500).json({ 
          message: 'Error uploading file to S3', 
          error: uploadError.message,
          details: {
            fileExists: !!req.file,
            hasBuffer: !!req.file?.buffer,
            bufferLength: req.file?.buffer?.length,
            mimetype: req.file?.mimetype,
            size: req.file?.size
          }
        });
      }
    }

    // Create the company
    const company = new Company({
      name,
      website,
      phone,
      email,
      industry,
      employees,
      profileImage,
      address: {
        street,
        city,
        state,
        country,
        postalCode,
      },
    });

    const newCompany = await company.save({ session });

    // Update user role and associate with the company
    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    user.company = newCompany._id;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ newCompany, user });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating company:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Update company details (Only the authenticated user's company)
exports.updateCompany = async (req, res) => {
  const updates = req.body;

  try {
    const updatedCompany = await Company.findByIdAndUpdate(req.user.company._id, updates, { new: true });

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(updatedCompany);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete the authenticated user's company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.user.company._id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Module Controller
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params; // Assuming the document ID is passed as a URL parameter
    const updates = req.body; // Assuming the updated data is sent in the request body

    // Find the document by ID and update it
    const updatedModule = await Company.findByIdAndUpdate(
      id,
      { $set: updates }, // Updates the specified fields
      { new: true, runValidators: true } // Return the updated document and validate fields
    );

    if (!updatedModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.status(200).json({
      message: 'Module updated successfully',
      data: updatedModule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Remove company profile image
exports.removeCompanyImage = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company._id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.profileImage || !company.profileImage.fileUrl) {
      return res.status(400).json({ message: 'Company has no profile image' });
    }

    // Get the S3 key from the file URL
    const key = company.profileImage.fileUrl.split('.com/')[1];

    // Delete the file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    
    await s3.deleteObject(params).promise();

    // Remove the profile image from the company document
    company.profileImage = null;
    await company.save();

    res.status(200).json({ message: 'Company profile image removed successfully' });
  } catch (error) {
    console.error('Error removing company profile image:', error);
    res.status(500).json({ 
      message: 'Error removing company profile image', 
      error: error.message 
    });
  }
};

// Upload company profile image
exports.uploadCompanyImage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const company = await Company.findById(req.user.company._id).session(session);
    
    if (!company) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Company not found' });
    }

    // Handle profile image upload to S3
    if (req.file && req.file.buffer) {
      try {
        const fileName = `${uuidv4()}-${req.file.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `company-images/${fileName}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        };

        const uploadResult = await s3.upload(params).promise();

        // Update the company's profile image
        company.profileImage = {
          fileName: fileName,
          fileType: req.file.mimetype,
          fileUrl: uploadResult.Location
        };

        await company.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Profile image uploaded successfully', profileImage: company.profileImage });
      } catch (uploadError) {
        console.error('Error uploading file to S3:', uploadError);
        await session.abortTransaction();
        return res.status(500).json({ 
          message: 'Error uploading file to S3', 
          error: uploadError.message 
        });
      }
    } else {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No file uploaded' });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error uploading company image:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.getCompanyImage = async (req, res) => {
  try {
    const id = req.user.company._id;
    const fileRecord = await Company.findById(id);
    
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `company-images/${fileRecord.profileImage.fileName}`, // Update path based on actual file structure
    };

    // Create an instance of S3 client
    const s3 = new S3({ client: s3Client });

    // Get the file from S3
    const data = await s3.getObject(params);

    // Set the response headers
    res.setHeader("Content-Type", fileRecord.profileImage.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileRecord.profileImage.fileName}"` // Use docName but keep original file extension
    );

    // Pipe the data to the response
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
};
