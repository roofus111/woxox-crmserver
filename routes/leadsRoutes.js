/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
const Lead = require('../models/Lead')
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
/**
 * @swagger
 * /api/leads/:
 *   get:
 *     summary: Retrieve all leads
 *     description: Fetch all leads stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.get("/", leadsController.getAllLeads);
/**
 * @swagger
 * /api/leads/getcampaign:
 *   get:
 *     summary: Retrieve all campaigns
 *     description: Fetch all leads stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.get("/getcampaign", leadsController.getCampaigns);
/**
 * @swagger
 * /api/leads/getleads/{campaign}:
 *   get:
 *     summary: get leads data in MongoDB
 *     description: This API is used to get lead data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: campaign
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: get successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.get("/getleads/:campaign", leadsController.getCounsellorLeads);
router.get("/getleadsfordoc", leadsController.getLeadsForDocs);
router.get("/search", leadsController.searchLeads);
/**
 * @swagger
 * /api/leads/:
 *   post:
 *     summary: Insert new leads data
 *     description: >
 *       This API is used to add a new leads to MongoDB.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - leads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     responses:
 *       200:
 *         description: leads added successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "leads added successfully."
 *       400:
 *         description: Bad Request - Invalid input.
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid request data."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to add the leads. Please try again later."
 */
router.post("/", leadsController.createLead);
/**
 * @swagger
 * /api/leads/assign/{campaignid}:
 *   put:
 *     summary: Assign leads equally to users
 *     description: This API is used to Assign leads equally to users
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put("/assign/:campaignid", leadsController.AssignLeadEqual);
/**
 * @swagger
 * /api/leads/updateprofile/{id}:
 *   put:
 *     summary: update lead 
 *     description: This API is used to update leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: data of the leadsprofile to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put("/updateprofile/:id", leadsController.UpdateLead);
/**
 * @swagger
 * /api/leads/assignlead/{leadId}/{userId}:
 *   put:
 *     summary: assignleads to users
 *     description: This API is used to assignleads to users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: data of the leadsprofile to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put("/assignlead/:leadId/:userId", leadsController.AssignUserToLead);
/**
 * @swagger
 * /api/leads/{leadId}/status:
 *   put:
 *     summary: update lead status
 *     description: This API is used to update lead status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: status of the leads is  updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put("/:leadId/status", leadsController.UpdateLeadStatus)
/**
 * @swagger
 * /api/leads/{leadId}/stages:
 *   put:
 *     summary: update lead stages
 *     description: This API is used to update lead stages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: stage of the leads is  updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put("/:leadId/stages", leadsController.UpdateLeadStages);
/**
 * @swagger
 * /api/leads/leads/{id}:
 *   get:
 *     summary: get leadsbyid data in MongoDB
 *     description: This API is used to get lead data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: leads
 *         required: true
 *         description: get leads byid 
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: get successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.get('/leads/:id', leadsController.getLeadById);
/**
 * @swagger
* /api/leads/deleteall:
*   delete:
*     summary: To delete record from mongodb
*     description: This API is used to delete campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: leads
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Data is deleted.
*/
router.delete('/deleteall', leadsController.deleteLeadsByCompany);
/**
 * @swagger
 * /api/leads/putleads/{id}:
 *   put:
 *     summary: update leads
 *     description: This API is used to update leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put('/putleads/:id',leadsController.updateLead);
/**
 * @swagger
 * /api/leads/leadsbycampaign/{campaignid}:
 *   get:
 *     summary: get leads on basics of campaign data in MongoDB
 *     description: This API is used to get lead data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: leads
 *         required: true
 *         description: get leads on basics of campaign
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: get successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.get('/leadsbycampaign/:campaignid', leadsController.getLeadsByCampaignId);
/**
 * @swagger
 * /api/leads/notes/{leadId}:
 *   put:
 *     summary: add notes to leads
 *     description: This API is used to add notes to leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
router.put('/notes/:leadId', leadsController.addNoteToLead);
/**
 * @swagger
* /api/leads/deletenotes:
*   delete:
*     summary: To delete record from mongodb
*     description: This API is used to delete campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: leads
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Data is deleted.
*/
router.delete('/deletenotes', leadsController.deleteNoteFromLead);

router.delete('/deleteMultiLeads', async (req, res) => {
  try {
    const { ids } = req.body; // Expecting an array of IDs in the request body
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: 'IDs must be an array' });
    }
    const result = await Lead.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: 'Items deleted successfully', result });
  } catch (error) {
    console.error('Error deleting items:', error);
    res.status(500).json({ message: 'Failed to delete items' });
  }
});

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


router.get('/leadInsight/:assigneeId' ,leadsController.homeInsight);

module.exports = router;
