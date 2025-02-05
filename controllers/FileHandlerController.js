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

// const {  ListObjectsV2Command } = require("@aws-sdk/client-s3");


// exports.getFilesFromS3 = async (req, res) => {
//   try {
//     const params = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Prefix: "fileuploads/", // Adjust the prefix if needed
//     };

//     const command = new ListObjectsV2Command(params);
//     const data = await s3Client.send(command);

//     if (!data.Contents || data.Contents.length === 0) {
//       return res.status(404).json({ message: "No files found in S3." });
//     }

//     const files = data.Contents.map((file) => ({
//       key: file.Key,
//       url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
//       lastModified: file.LastModified,
//       size: file.Size,
//     }));

//     return res.status(200).json({ message: "Files retrieved successfully", files });
//   } catch (error) {
//     console.error("Error retrieving files from S3:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

// exports.getFilesByParentId = async (req, res) => {
//   try {
//     const { parentId } = req.params; // Extract parentId from the request URL

//     // Find files with the specified parent ID
//     const files = await Files.find({ parent: parentId });

//     if (!files.length) {
//       return res.status(404).json({ message: "No files found for this parent ID." });
//     }

//     return res.status(200).json({ message: "Files retrieved successfully", files });
//   } catch (error) {
//     console.error("Error retrieving files:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
const {  ListObjectsV2Command } = require("@aws-sdk/client-s3");
const Folders = require("../models/folderHandler"); // Assuming you have a Folder model

exports.getFilesAndFoldersByParentId = async (req, res) => {
  try {
    const { parentId } = req.params; // Extract parentId from the request URL

    // 1️⃣ Fetch Files from MongoDB
    const dbFiles = await Files.find({ parent: parentId });

    // 2️⃣ Fetch Folders from MongoDB
    const dbFolders = await Folders.find({ parent: parentId });

    // 3️⃣ Fetch Files & Folders from S3
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: `fileuploads/${parentId}/`, // Assuming parentId is used as folder structure in S3
      Delimiter: "/", // Helps in identifying folders
    };

    const command = new ListObjectsV2Command(s3Params);
    const s3Data = await s3Client.send(command);

    // Extract Files from S3 Response
    const s3Files = s3Data.Contents
      ? s3Data.Contents.map((file) => ({
          key: file.Key,
          url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
          lastModified: file.LastModified,
          size: file.Size,
          type: "file",
        }))
      : [];

    // Extract Folders from S3 Response (CommonPrefixes contains folder names)
    const s3Folders = s3Data.CommonPrefixes
      ? s3Data.CommonPrefixes.map((folder) => ({
          name: folder.Prefix.replace(`fileuploads/${parentId}/`, "").replace("/", ""),
          path: folder.Prefix,
          type: "folder",
        }))
      : [];

    // 4️⃣ Combine All Results
    return res.status(200).json({
      message: "Files and folders retrieved successfully",
      files: [...dbFiles, ...s3Files], // Combine MongoDB + S3 files
      folders: [...dbFolders, ...s3Folders], // Combine MongoDB + S3 folders
    });
  } catch (error) {
    console.error("Error retrieving files and folders:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};




