const express = require("express");
const router = express.Router();
const leadsController = require("../controllers/leadsController");
const authenticateUser = require("../middleware/authenticateUser");
const multer = require("multer");
const { S3 } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const File = require("../models/document"); // Import the File model
const s3Client = require("../config/s3"); // Import the S3 client
// Set up multer for S3
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.get("/docs/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileRecord = await File.findById(fileId);

    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileRecord.fileUrl.split("/").pop(), // Extract the key from the file URL
    };

    // Create an instance of S3 client
    const s3 = new S3({ client: s3Client });

    // Get the file from S3
    const data = await s3.getObject(params);

    // Set the response headers
    res.setHeader("Content-Type", fileRecord.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileRecord.fileName}"`
    );

    // Pipe the data to the response
    data.Body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.use(authenticateUser); // Apply authentication to all routes
router.get("/", leadsController.getAllLeads);
router.get("/search", leadsController.searchLeads);
router.post("/", leadsController.createLead);
router.put("/assign", leadsController.AssignLeadEqual);
router.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const docName = req.body.docName;
  const leadId = req.body.leadId;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}-${file.originalname}`, // Use UUID as part of the file name
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    // Upload the file to S3 using the s3Client
    const s3 = new S3({ client: s3Client });
    await s3.putObject(params);

    const fileRecord = new File({
      leadId: leadId,
      createdBy: req.user,
      docName: docName,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`, // Construct the S3 URL
    });

    await fileRecord.save();
    res
      .status(200)
      .json({ message: "File uploaded successfully", file: fileRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/docs/bylead/:leadId", async (req, res) => {
  try {
    const leadId = req.params.leadId; // Accessing leadId from route parameters
    const files = await File.find({ leadId: leadId }).populate(
      "createdBy",
      "name"
    ); // Filter documents by leadId
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
