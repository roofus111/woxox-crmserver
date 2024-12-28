/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the lead.
 *         email:
 *           type: string
 *           description: Email address of the lead.
 *           example: johndoe@example.com
 *         phone:
 *           type: string
 *           description: Phone number of the lead.
 *           example: "+1234567890"
 *         campaign:
 *           type: string
 *           description: Campaign name associated with the lead.
 *           example: Summer Admissions Campaign
 *         campaignid:
 *           type: string
 *           description: Campaign ID (reference to the Campaign collection).
 *           example: 648f4c0b60f1e622946b6789
 *         status:
 *           type: string
 *           description: Status of the lead.
 *           enum: 
 *             - New
 *             - Contacted
 *             - Interested
 *             - Not Interested
 *             - Converted
 *             - Pending
 *             - In Progress
 *             - Lost
 *             - Won
 *           default: New
 *         source:
 *           type: string
 *           description: Source of the lead.
 *           example: Website
 *         Customer:
 *           type: string
 *           description: Reference to the Customer collection.
 *           example: 648f4c0b60f1e622946b6789
 *         company:
 *           type: string
 *           description: Reference to the Company collection.
 *           example: 648f4c0b60f1e622946b6789
 *         assignedTo:
 *           type: string
 *           description: Reference to the User assigned to this lead.
 *           example: 648f4c0b60f1e622946b6789
 *         untouched:
 *           type: boolean
 *           description: Flag to indicate if the lead has been untouched.
 *           default: true
 *         notes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Note'
 *           description: List of notes associated with the lead.
 *         profile:
 *           $ref: '#/components/schemas/Form'
 *         stages:
 *           type: string
 *           description: Current stage of the lead.
 *           enum:
 *             - null
 *             - Pending
 *             - In Progress
 *             - Document Collected
 *             - Pending Documents
 *             - Application Submitted
 *             - Interview Scheduled
 *             - Offer letter Received
 *             - Offer letter Rejected
 *             - Visa Documentation In Progress
 *             - Visa Documentation Success
 *             - Visa Approved
 *             - Visa Rejected
 *           default: null
 *         additionalFields:
 *           type: object
 *           additionalProperties: true
 *           description: Flexible field for additional data.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       required:
 *         - note_id
 *         - author
 *         - content
 *       properties:
 *         note_id:
 *           type: string
 *           description: Unique identifier for the note
 *           example: "12345"
 *         author:
 *           type: string
 *           description: Author of the note
 *           example: "John Doe"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The time when the note was created
 *           example: "2024-12-28T14:30:00Z"
 *         content:
 *           type: string
 *           description: The content of the note
 *           example: "This is an example note."
 */



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
router.get("/getcampaign", leadsController.getCampaigns);
router.get("/getleads/:campaign", leadsController.getCounsellorLeads);
router.get("/getleadsfordoc", leadsController.getLeadsForDocs);
router.get("/search", leadsController.searchLeads);
router.post("/", leadsController.createLead);
router.put("/assign/:campaignid", leadsController.AssignLeadEqual);
router.put("/updateprofile/:id", leadsController.UpdateLead);
router.put("/assignlead/:leadId/:userId", leadsController.AssignUserToLead);
router.put("/:leadId/status", leadsController.UpdateLeadStatus)
router.put("/:leadId/stages", leadsController.UpdateLeadStages);
router.get('/leads/:id', leadsController.getLeadById);
router.delete('/deleteall', leadsController.deleteLeadsByCompany);
router.put('/putleads/:id',leadsController.updateLead);
router.get('/leadsbycampaign/:campaignid', leadsController.getLeadsByCampaignId);
router.put('/notes/:leadId', leadsController.addNoteToLead);
router.delete('/deletenotes', leadsController.deleteNoteFromLead);

router.put('/assign-multiple/:userId',leadsController.AssignMultipleLeadsToUser);
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
