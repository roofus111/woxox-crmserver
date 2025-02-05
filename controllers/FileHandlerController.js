const AWS = require('aws-sdk');
const Files=require('../models/Filehandler')
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names
const {S3} = require("@aws-sdk/client-s3")
const s3Client = require("../config/s3")
const mongoose =require("mongoose")
// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.createFile = async (req, res) => {
  try {
    const {
      leadId,
      docName,
      fileName,
      fileType,
      fileUrl,
      parent,
      access,
      shared, // List of users to share with, including their access levels
      root = false, // Default root to false if not provided
    } = req.body;

    const files = req.files; // Assuming you're using a middleware like multer to handle file uploads
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    // Upload files to S3 and get URLs
    const uploadedFiles = [];
    for (const file of files) {
      const fileContent = file.buffer; // File content from multer
      const fileKey = `${uuidv4()}-${file.originalname}`; // Unique file name
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `fileuploads/${fileKey}`,
        Body: fileContent,
        ContentType: file.mimetype,
      };

      const uploadResult = await s3.upload(params).promise();
      uploadedFiles.push({
        fileName: fileKey,
        fileType: file.mimetype,
        fileUrl: uploadResult.Location, // S3 file URL
      });
    }

    // Create new file document
    const newFile = new Files({
      leadId,
      docName,
      fileName: fileName || uploadedFiles[0].fileName,
      fileType: fileType || uploadedFiles[0].fileType,
      fileUrl: fileUrl || uploadedFiles[0].fileUrl,
      root, // Set root based on input
      uploadedAt: new Date(),
      createdBy: req.user._id, // Assuming req.user contains the logged-in user's info
      parent,
      access: access || 'private', // Default to private if no access level is provided
      shared, // Shared users array
    });

    // Save the file to the database
    const savedFile = await newFile.save();

    return res.status(201).json({ message: 'File created successfully', file: savedFile });
  } catch (error) {
    console.error('Error creating file:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Controller to get files by different parameters
exports.getFiles = async (req, res) => {
  try {
    // Retrieve query parameters
    const { leadId, userId, access, root } = req.query;
    console.log("Received leadId:", leadId); 
    // Build the query object based on the parameters
    let query = {};

    if (leadId) {
      query.leadId = leadId; // Filter by leadId if provided
    }
    
    if (userId) {
      query.createdBy = userId; // Filter by createdBy (userId) if provided
    }

    if (access) {
      query.access = access; // Filter by access level if provided
    }

    if (root !== undefined) {
      query.root = root === 'true'; // Filter by root status (boolean) if provided
    }

    // Fetch files from the database based on the query object
    const files = await Files.find(query)
    .populate('leadId') // Optionally populate lead name (if you need lead details)
      .populate('createdBy', 'name') // Optionally populate the user who created the file
      .populate('parent', 'folderName') // Optionally populate the parent folder
      .exec();

    // Return the files as a response
    if (files.length === 0) {
      return res.status(404).json({ message: 'No files found matching the criteria' });
    }

    return res.status(200).json({ message: 'Files retrieved successfully', files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
