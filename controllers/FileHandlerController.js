const AWS = require("aws-sdk"); 
const Files = require("../models/Filehandler"); 
const User = require("../models/User"); 
const { v4: uuidv4 } = require("uuid"); // For generating unique file names
const { S3 } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");
const mongoose = require("mongoose");
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
      shared, // List of users to share with
      root = false, // Default root to false if not provided
    } = req.body;

    const files = req.files; // Assuming multer is handling file uploads

    // Validate file upload
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    // Ensure user has a company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;
    const uploadedFiles = [];
    const cleanFileName = files[0].originalname;
    // Upload each file to S3 and get its URL
    for (const file of files) {
      const fileContent = file.buffer;
      const fileKey = `${uuidv4()}-${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `fileuploads/${companyId}/${fileKey}`, // Store files under company ID
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
      User: req.user._id,
      leadId,
      docName: cleanFileName,
      fileName: fileName || uploadedFiles[0].fileName,
      fileType: fileType || uploadedFiles[0].fileType,
      fileUrl: fileUrl || uploadedFiles[0].fileUrl,
      root,
      uploadedAt: new Date(),
      createdBy: req.user._id,
      company: companyId, // Ensure file is linked to the company
      parent,
      access: access || "private",
      shared,
    });

    // Save the file to the database
    const savedFile = await newFile.save();

    return res
      .status(201)
      .json({ message: "File created successfully", file: savedFile });
  } catch (error) {
    console.error("Error creating file:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const Folders = require("../models/folderHandler"); // Import Folders Model

exports.getFilesAndFoldersByParentId = async (req, res) => {
  try {
    const { parentId } = req.query;
    console.log(parentId);
    // ✅ Ensure user has a valid company ID
    if (!req.user || !req.user.company || !req.user.company._id) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Company ID is required" });
    }
    const companyId = req.user.company._id;
    let filter = {};
    if (parentId === undefined) {
      filter = { User: req.user._id, company: companyId, root: true };
    }else{
      filter = { parent: parentId, company: companyId };
    }
    console.log(filter);

    // 1️⃣ Fetch the Latest Files from MongoDB (Filtered by company)
    const dbFiles = await Files.find(filter);

    // 2️⃣ Fetch Folders from MongoDB (Filtered by company)
    const dbFolders = await Folders.find(filter);

    // 3️⃣ Fetch Files & Folders from S3 (Scoped to Company)
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: `fileuploads/${companyId}/${parentId}/`, // Ensure files belong to the correct company
      Delimiter: "/",
    };

    const command = new ListObjectsV2Command(s3Params);
    const s3Data = await s3Client.send(command);

    // ✅ Extract Files from S3 Response
    const s3Files = s3Data.Contents
      ? s3Data.Contents.map((file) => ({
          key: file.Key,
          url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
          lastModified: file.LastModified,
          size: file.Size,
          type: "file",
        }))
      : [];

    // ✅ Extract Folders from S3 Response
    const s3Folders = s3Data.CommonPrefixes
      ? s3Data.CommonPrefixes.map((folder) => ({
          name: folder.Prefix.replace(
            `fileuploads/${companyId}/${parentId}/`,
            ""
          ).replace("/", ""),
          path: folder.Prefix,
          type: "folder",
        }))
      : [];

    // 4️⃣ Ensure Updated File Names Are Reflected
    const updatedFiles = dbFiles.map((dbFile) => {
      const matchingS3File = s3Files.find((s3File) =>
        s3File.key.includes(dbFile.fileName)
      );
      return {
        ...dbFile.toObject(),
        fileUrl: matchingS3File ? matchingS3File.url : dbFile.fileUrl,
        lastModified: matchingS3File
          ? matchingS3File.lastModified
          : dbFile.uploadedAt,
      };
    });

    // 5️⃣ Combine All Results & Return
    return res.status(200).json({
      message: "Files and folders retrieved successfully",
      files: updatedFiles,
      folders: [...dbFolders, ...s3Folders], // Merge MongoDB + S3 folders
    });
  } catch (error) {
    console.error("Error retrieving files and folders:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const {
  CopyObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
exports.updateFileName = async (req, res) => {
  try {
    const { fileId } = req.params;
    let { fileName } = req.body;

    if (!fileId || !fileName) {
      return res
        .status(400)
        .json({ message: "File ID and new file name are required." });
    }

    // 🔹 Find the File by ID
    const file = await Files.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // 🔹 Ensure the filename is unique in the same parent folder
    const duplicateFile = await Files.findOne({
      fileName,
      parent: file.parent,
    });
    if (duplicateFile && duplicateFile._id.toString() !== fileId) {
      return res.status(400).json({
        message: "A file with this name already exists in the same folder.",
      });
    }

    // 🔹 Ensure file extension is retained
    const oldFileName = file.fileName;
    const fileExtension = oldFileName.split(".").pop();
    if (!fileName.includes(".")) {
      fileName = `${fileName}.${fileExtension}`;
    }

    // 🔹 Extract S3 Key from the existing file URL
    const oldFileKey = file.fileUrl.split(".amazonaws.com/")[1]; // Get S3 path
    const newFileKey = `fileuploads/${fileName}`;

    // 🔹 Rename the file in S3 (Copy & Delete method)
    if (oldFileKey) {
      const copyParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        CopySource: `${process.env.AWS_BUCKET_NAME}/${oldFileKey}`,
        Key: newFileKey,
      };
      await s3Client.send(new CopyObjectCommand(copyParams));

      // Delete the old file only if copy is successful
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: oldFileKey,
      };
      await s3Client.send(new DeleteObjectCommand(deleteParams));

      // 🔹 Update the file URL in MongoDB
      file.fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileKey}`;
    }

    // 🔹 Update the file name in MongoDB
    file.fileName = fileName;
    await file.save();

    return res
      .status(200)
      .json({ message: "File name and URL updated successfully", file });
  } catch (error) {
    console.error("Error updating file name:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.copyFile = async (req, res) => {
  try {
    const { fileId, parent } = req.body; // Parent is for MongoDB only

    // 🔹 Find the original file in MongoDB
    const file = await Files.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    const originalFileName = file.fileName;
    const fileExtension = originalFileName.split(".").pop();
    const fileBaseName =
      originalFileName.substring(0, originalFileName.lastIndexOf(".")) ||
      originalFileName;

    // 🔹 Check existing copies in S3
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: `fileuploads/${fileBaseName}`,
    };

    const command = new ListObjectsV2Command(s3Params);
    const existingFiles = await s3Client.send(command);

    // 🔹 Generate a unique filename (file (1).pdf, file (2).pdf)
    let copyCount = 1;
    let newFileName = `${fileBaseName} (${copyCount}).${fileExtension}`;
    let newFileKey = `fileuploads/${newFileName}`;

    while (existingFiles.Contents?.some((f) => f.Key === newFileKey)) {
      copyCount++;
      newFileName = `${fileBaseName} (${copyCount}).${fileExtension}`;
      newFileKey = `fileuploads/${newFileName}`;
    }

    // 🔹 Properly format CopySource
    const originalFileKey = file.fileUrl.split(".amazonaws.com/")[1]; // Extract Key from URL
    const copySource = `${process.env.AWS_BUCKET_NAME}/${originalFileKey}`;

    console.log("Copying file in S3 from:", copySource, "to:", newFileKey);

    // 🔹 Copy file in S3
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        CopySource: copySource,
        Key: newFileKey,
        ACL: "private", // Optional: Change if public
      })
    );

    // 🔹 Save new file entry in MongoDB with **parent retained**
    const newFile = new Files({
      leadId: file.leadId,
      docName: file.docName,
      fileName: newFileName,
      fileType: file.fileType,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileKey}`,
      root: false,
      uploadedAt: new Date(),
      createdBy: req.user._id,
      parent: parent || file.parent, // Retain original parent or use provided one
      access: file.access,
      shared: file.shared,
      company: file.company || req.user.companyId, // Example fallback
    });

    await newFile.save();

    return res
      .status(201)
      .json({ message: "File copied successfully", file: newFile });
  } catch (error) {
    console.error("Error copying file:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.moveFile = async (req, res) => {
  try {
    const { fileId, parent } = req.body; // File ID & New Parent ID

    // 🔹 Find the existing file
    const file = await Files.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // 🔹 Check if a file with the same name already exists in the target folder (MongoDB)
    const existingFile = await Files.findOne({
      fileName: file.fileName,
      parent: parent,
    });
    if (existingFile) {
      return res.status(400).json({
        message: "A file with this name already exists in the target folder.",
      });
    }

    // 🔹 Update only the parent in MongoDB (File stays in the same S3 location)
    file.parent = parent;
    await file.save();

    return res.status(200).json({ message: "File moved successfully", file });
  } catch (error) {
    console.error("Error moving file:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params; // Get file ID from request

    // 🔹 Find the file in MongoDB
    const file = await Files.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // 🔹 Extract file key from S3 URL
    const fileKey = file.fileUrl.replace(
      `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
      ""
    );

    // 🔹 Delete the file from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      })
    );

    // 🔹 Delete the file from MongoDB
    await Files.findByIdAndDelete(fileId);

    return res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("Error deleting file:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.getFilesByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;

    // 🔹 Find all files associated with the given leadId
    const files = await Files.find({ leadId });

    if (!files.length) {
      return res.status(404).json({ message: "No files found for this lead." });
    }

    return res
      .status(200)
      .json({ message: "Files retrieved successfully", files });
  } catch (error) {
    console.error("Error retrieving files:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const Leads = require("../models/Lead");

exports.listAllLeadsFromFilesAndFolders = async (req, res) => {
  try {
    const companyId = req.user.company._id; // Extract company ID from user

    // 🔹 Get unique lead IDs from Files & Folders filtered by company
    const fileLeadIds = await Files.distinct("leadId", { company: companyId });
    const folderLeadIds = await Folders.distinct("leadId", {
      company: companyId,
    });

    // 🔹 Merge and remove duplicates
    const uniqueLeadIds = [...new Set([...fileLeadIds, ...folderLeadIds])];

    if (uniqueLeadIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No leads found for this company." });
    }

    // 🔹 Fetch lead details (only name & email)
    const leads = await Leads.find({
      _id: { $in: uniqueLeadIds },
      company: companyId,
    }).select("name email");

    return res.status(200).json({
      message: "All leads retrieved successfully",
      leads,
    });
  } catch (error) {
    console.error("Error retrieving leads:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const TagManager = require('../models/Tagmanager');


exports.addTagsToFile = async (req, res) => {
  try {
    const { tags } = req.body; // Array of tag IDs
    const fileId = req.params.id;

    // Validate file exists
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    // Validate all tags exist
    const validTags = await TagManager.find({ _id: { $in: tags } });
    if (validTags.length !== tags.length) {
      return res.status(400).json({ error: "One or more tags are invalid" });
    }

    // Update file with tags
    file.tags.push(...tags);
    await file.save();

    res.json({ message: "Tags added successfully", file });
  } catch (error) {
    res.status(500).json({ error: "Error adding tags to file", details: error.message });
  }
};

/**
 * Remove a tag from a file
 */
exports.removeTagFromFile = async (req, res) => {
  try {
    const { tagId } = req.body; // Tag ID to remove
    const fileId = req.params.id;

    // Validate file exists
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    // Remove tag from file
    file.tags = file.tags.filter(tag => tag.toString() !== tagId);
    await file.save();

    res.json({ message: "Tag removed successfully", file });
  } catch (error) {
    res.status(500).json({ error: "Error removing tag from file", details: error.message });
  }
};


// Request a file upload
exports.requestUpload = async (req, res) => {
  try {
    const { docName, leadId} = req.body;

    const newFileRequest = new Files({
      docName,
      leadId,
      request: true,
      requestBy: req.user._id,
      createdBy: req.user._id,
      company: req.user.company._id
    });

    const saved = await newFileRequest.save();
    res.status(201).json({ message: "File upload requested", data: saved });
  } catch (err) {
    console.error("Request upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.uploadFile = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ error: "Unauthorized: Company ID is required" });
    }

    const companyId = req.user.company._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Optional: Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type." });
    }

    // Generate unique file key
    const fileKey = `${uuidv4()}-${file.originalname}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `fileuploads/${companyId}/${fileKey}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload to S3
    const uploadResult = await s3.upload(params).promise();

    // Find and update the requested file document
    const updatedFile = await Files.findByIdAndUpdate(
      requestId,
      {
        $set: {
          fileName: fileKey,
          fileType: file.mimetype,
          fileUrl: uploadResult.Location,
          uploadedAt: new Date(),
          request: false,
          updatedBy: req.user._id,
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "File request not found." });
    }

    res.status(200).json({
      message: "File uploaded and request fulfilled successfully",
      file: updatedFile,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// controllers/FileHandlerController.js (lines 547-570)
exports.deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // Assuming the request ID is passed as a URL parameter

    const deletedRequest = await Files.findByIdAndDelete(requestId);
    
    if (!deletedRequest) {
      return res.status(404).json({ error: "File request not found" });
    }

    res.status(200).json({ message: "File request deleted successfully", data: deletedRequest });
  } catch (err) {
    console.error("Delete request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
// // Create a new document
// exports.createDocument = async (req, res) => {
//   try {
//     const { title, content, docName } = req.body; // Ensure docName is included

//     // Validate required fields
//     if (!docName) {
//       return res.status(400).json({ message: "docName is required." });
//     }

//     const newDocument = new Files({
//       title,
//       content,
//       docName, // Include docName in the document
//       createdBy: req.user._id,
//       company: req.user.company._id,
//       createdAt: new Date(),
//       isCreated: true, // Add this line to indicate the document has been created
//     });

//     await newDocument.save();
//     return res.status(201).json({ message: "Document created successfully", document: newDocument });
//   } catch (error) {
//     console.error("Error creating document:", error);
//     return res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
const DocumentTemplate = require('../models/Template'); // Adjust the path as necessary
// Create a new document
exports.createDocument = async (req, res) => {
  try {
    const { title, content, docName, templateId } = req.body; // Ensure templateId is included

    // Validate required fields
    if (!docName) {
      return res.status(400).json({ message: "docName is required." });
    }

    // Fetch the template if templateId is provided
    let template = null;
    if (templateId) {
      template = await DocumentTemplate.findById(templateId); // Fetch the template
      if (!template) {
        return res.status(404).json({ message: "Template not found." });
      }
    }

    // Create a new document using the template if available
    const newDocument = new Files({
      title: title || template.title, // Use template title if provided
      content: content || template.body, // Use template body if provided
      docName, // Include docName in the document
      createdBy: req.user._id,
      company: req.user.company._id,
      createdAt: new Date(),
      isCreated: true, // Add this line to indicate the document has been created
    });

    await newDocument.save();
    return res.status(201).json({ message: "Document created successfully", document: newDocument });
  } catch (error) {
    console.error("Error creating document:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Edit an existing document
exports.editDocument = async (req, res) => {
  try {
    const { documentId } = req.params; // Get document ID from request parameters
    const { content, docName } = req.body; // New content and docName for the document

    const document = await Files.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Validate required fields
    if (!docName) {
      return res.status(400).json({ message: "docName is required." });
    }

    document.content = content; // Update the content
    document.docName = docName; // Update the docName
    await document.save();

    return res.status(200).json({ message: "Document updated successfully", document });
  } catch (error) {
    console.error("Error editing document:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all documents for the authenticated user
exports.getAllDocuments = async (req, res) => {
  try {
    const companyId = req.user.company._id; // Get the company ID from the authenticated user

    // Fetch all documents for the user's company
    const documents = await Files.find({ company: companyId });

    if (!documents.length) {
      return res.status(404).json({ message: "No documents found." });
    }

    return res.status(200).json({ message: "Documents retrieved successfully", documents });
  } catch (error) {
    console.error("Error retrieving documents:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get a document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params; // Get document ID from request parameters

    // Find the document by ID
    const document = await Files.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    return res.status(200).json({ message: "Document retrieved successfully", document });
  } catch (error) {
    console.error("Error retrieving document:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
