/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *         - company
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the lead
 *         district:
 *           type: string
 *           description: District of the lead
 *         email:
 *           type: string
 *           description: Email address of the lead
 *         phone:
 *           type: string
 *           description: Phone number of the lead
 *         campaign:
 *           type: string
 *           description: Campaign name associated with the lead
 *         campaignid:
 *           type: string
 *           description: ID of the campaign associated with the lead
 *         status:
 *           type: string
 *           enum: [New, Contacted, Interested, Not Interested, Converted, Pending, In Progress, Lost, Won, Duplicate]
 *           description: Status of the lead in the sales process
 *         source:
 *           type: string
 *           description: Source from which the lead was acquired
 *         Customer:
 *           type: string
 *           description: Customer associated with the lead
 *         company:
 *           type: string
 *           description: Company associated with the lead
 *         assignedTo:
 *           type: string
 *           description: User ID who is assigned to the lead
 *         untouched:
 *           type: boolean
 *           default: true
 *           description: Indicates whether the lead has been contacted
 *         notes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *                 description: Author of the note
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp when the note was created
 *               content:
 *                 type: string
 *                 description: Content of the note
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the lead was created
 *         profile:
 *           type: object
 *           properties:
 *             age:
 *               type: integer
 *               description: Age of the lead
 *             address:
 *               type: string
 *               description: Address of the lead
 *             pinCode:
 *               type: string
 *               description: Pin code of the lead
 *             state:
 *               type: string
 *               description: State of the lead
 *             city:
 *               type: string
 *               description: City of the lead
 *             country:
 *               type: string
 *               description: Country of the lead
 *             sslcJoinYear:
 *               type: integer
 *               description: Year the lead joined SSLC
 *             sslcPassOutYear:
 *               type: integer
 *               description: Year the lead passed out of SSLC
 *             sslcScore:
 *               type: number
 *               format: float
 *               description: Score obtained by the lead in SSLC
 *             hscJoinYear:
 *               type: integer
 *               description: Year the lead joined HSC
 *             hscPassOutYear:
 *               type: integer
 *               description: Year the lead passed out of HSC
 *             hscScore:
 *               type: number
 *               format: float
 *               description: Score obtained by the lead in HSC
 *             UGJoinYear:
 *               type: integer
 *               description: Year the lead joined UG program
 *             UGPassOutYear:
 *               type: integer
 *               description: Year the lead passed out of UG program
 *             UG_CGPA:
 *               type: number
 *               format: float
 *               description: CGPA of the lead in UG
 *             PGJoinYear:
 *               type: integer
 *               description: Year the lead joined PG program
 *             PGPassOutYear:
 *               type: integer
 *               description: Year the lead passed out of PG program
 *             PG_CGPA:
 *               type: number
 *               format: float
 *               description: CGPA of the lead in PG
 *             ieltsScore:
 *               type: number
 *               format: float
 *               description: IELTS score of the lead
 *             pteToeflScore:
 *               type: number
 *               format: float
 *               description: PTE or TOEFL score of the lead
 *             germanScore:
 *               type: number
 *               format: float
 *               description: German language score of the lead
 *             xiiEnglishScore:
 *               type: number
 *               format: float
 *               description: XIIth English score of the lead
 *             careerGapFrom:
 *               type: integer
 *               description: Year from which the career gap started
 *             careerGapTo:
 *               type: integer
 *               description: Year until which the career gap lasted
 *             experienceFrom:
 *               type: integer
 *               description: Year from which the lead started work experience
 *             experienceTo:
 *               type: integer
 *               description: Year until which the lead worked
 *             backlogs:
 *               type: integer
 *               description: Number of backlogs the lead has
 *             targetIntake:
 *               type: string
 *               description: The lead's target intake (e.g., Fall 2025)
 *             programOfInterest:
 *               type: string
 *               description: Program the lead is interested in
 *             countryOfInterest:
 *               type: string
 *               description: Country the lead is interested in
 *             visaRefusal:
 *               type: string
 *               description: Details about the lead's visa refusal (if applicable)
 *             tuitionFeePreference:
 *               type: number
 *               format: float
 *               description: Tuition fee preference of the lead
 *       example:
 *         name: "John Doe"
 *         phone: "1234567890"
 *         company: "TechCorp"
 *         status: "New"
 *         profile:
 *           age: 24
 *           address: "123 Main St"
 *           pinCode: "123456"
 *           state: "California"
 *           city: "Los Angeles"
 *           country: "USA"
 *           sslcJoinYear: 2012
 *           sslcPassOutYear: 2014
 *           sslcScore: 85
 *           hscJoinYear: 2014
 *           hscPassOutYear: 2016
 *           hscScore: 90
 *           UGJoinYear: 2016
 *           UGPassOutYear: 2020
 *           UG_CGPA: 8.5
 *           PGJoinYear: 2020
 *           PGPassOutYear: 2022
 *           PG_CGPA: 9.0
 *           ieltsScore: 7.5
 *           pteToeflScore: 65
 *           germanScore: 80
 *           xiiEnglishScore: 85
 *           careerGapFrom: 2022
 *           careerGapTo: 2023
 *           experienceFrom: 2023
 *           experienceTo: 2024
 *           backlogs: 0
 *           targetIntake: "Fall 2025"
 *           programOfInterest: "Computer Science"
 *           countryOfInterest: "Canada"
 *           visaRefusal: "No"
 *           tuitionFeePreference: 20000
 */

const express = require("express");
const router = express.Router();
const leadsController = require("../controllers/leadsController");
const authenticateUser = require("../middleware/authenticateUser");
const multer = require("multer");
const { S3 } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const File = require("../models/Filehandler"); // Update to match the actual filename casing
const s3Client = require("../config/s3");
const Lead = require('../models/Lead')
// Set up multer for S3
const storage = multer.memoryStorage();
const upload = multer({ storage });
/**
 * @swagger
 * /api/leads/docs/{id}:
 *   get:
 *     summary: Retrieve a file document by ID
 *     description: This endpoint allows you to retrieve a specific file document by its ID, which will be downloaded from AWS S3.
 *     tags:
 *       - Leads
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the file document to be retrieved
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the file.
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "File not found"
 *       500:
 *         description: Internal server error while retrieving the file.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error retrieving file"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get("/docs/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileRecord = await File.findById(fileId);
    
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `fileuploads/${fileRecord.company}/${fileRecord.fileName}`, // Update path based on actual file structure
    };

    // Create an instance of S3 client
    const s3 = new S3({ client: s3Client });

    // Get the file from S3
    const data = await s3.getObject(params);

    // Set the response headers
    res.setHeader("Content-Type", fileRecord.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileRecord.docName}${fileRecord.fileName.substring(fileRecord.fileName.lastIndexOf('.'))}"` // Use docName but keep original file extension
    );

    // Pipe the data to the response
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});
router.use(authenticateUser); // Apply authentication to all routes
/**
 * @swagger
 * /api/leads/:
 *   get:
 *     summary: Get all leads with pagination
 *     description: Retrieves all leads for the authenticated user's company with pagination, including details about the assigned user.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of leads per page (default is 10)
 *     responses:
 *       200:
 *         description: A list of leads along with pagination details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 totalLeads:
 *                   type: integer
 *                   description: The total number of leads in the database
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages available for pagination
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "An error occurred while retrieving the leads."
   *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.get("/company/user-performance", leadsController.userPerformance);

router.get("/", leadsController.getAllLeads);
/**
 * @swagger
 * /api/leads/getcampaign:
 *   get:
 *     summary: Retrieve campaigns for the logged-in user.
 *     description: Fetches distinct campaign names and detailed campaign documents assigned to the logged-in user.
 *     tags:
 *       - Leads
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         description: The type of campaign data ("name" or "details").
 *                       value:
 *                         oneOf:
 *                           - type: string
 *                           - $ref: '#/components/schemas/Lead'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching campaigns"
 *                 error:
 *                   type: string
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get("/getcampaign", leadsController.getCampaigns);

router.get("/getleads/:campaign", leadsController.getCounsellorLeads);
/**
 * @swagger
 * /api/leads/getleadsfordoc:
 *   get:
 *     summary: Get a list of leads with "Pending" status.
 *     description: Fetches leads that are marked as "Pending" and belong to the user's company.
 *     tags:
 *       - Leads
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of "Pending" leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error retrieving pending leads"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get("/getleadsfordoc", leadsController.getLeadsForDocs);

router.get("/search", leadsController.searchLeads);
/**
 * @swagger
 * /api/leads/:
 *   post:
 *     summary: Create a new lead
 *     description: Creates a new lead with the provided details, including validation for existing campaigns, phone numbers, and customers.
 *     tags:
 *       - Leads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the lead.
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 description: The phone number of the lead.
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 description: The email of the lead.
 *                 example: "johndoe@example.com"
 *               campaignid:
 *                 type: string
 *                 description: The ID of the campaign the lead is associated with.
 *                 example: "60d5f8d9b8b9b926c8e8eb9b"
 *               district:
 *                 type: string
 *                 description: The district where the lead is located.
 *                 example: "New York"
 *               assignedTo:
 *                 type: string
 *                 description: The ID of the user who is assigned to manage the lead.
 *                 example: "60d2bc3d3c2d5f3b8b0d4eab"
 *     responses:
 *       201:
 *         description: Successfully created the lead.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Bad request, missing required fields (name, phone, or campaignid).
 *       404:
 *         description: Campaign not found with the given campaign ID.
 *       409:
 *         description: A lead with the same phone number already exists in the system.
 *       500:
 *         description: Internal server error while creating the lead.   
   *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.post("/", leadsController.createLead);
/**
 * @swagger
 * /api/leads/assign/{campaignid}:
 *   put:
 *     summary: Assign unassigned leads equally among users
 *     description: This API will distribute unassigned leads equally among users for a given campaign.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: The ID of the campaign for which unassigned leads will be distributed.
 *         schema:
 *           type: string
 *           example: "60d5f8d9b8b9b926c8e8eb9b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 users:
 *                   type: string
 *                   description: The ID of the user to whom the lead will be assigned.
 *                   example: ["60d2bc3d3c2d5f3b8b0d4eab"]
 *     responses:
 *       200:
 *         description: Leads were successfully assigned to users equally.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "10 Unassigned Leads are Assigned to 5 Users Equally"
 *       400:
 *         description: Bad request, either no users were provided or no unassigned leads were found.
 *       404:
 *         description: No unassigned leads found for the given campaign.
 *       500:
 *         description: Internal server error during lead assignment.
    *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put("/assign/:campaignid", leadsController.AssignLeadEqual);
/**
 * @swagger
 * /api/leads/updateprofile/{id}:
 *   put:
 *     summary: Update a lead by ID
 *     tags:
 *       - Leads
 *     description: Updates the lead with the specified ID and provided data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the lead to be updated.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The data to update the lead with. All fields are optional, and only the fields provided will be updated.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *                 description: The name of the lead.
 *               email:
 *                 type: string
 *                 example: "johndoe@example.com"
 *                 description: The email of the lead.
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *                 description: The phone number of the lead.
 *               campaign:
 *                 type: string
 *                 example: "Campaign XYZ"
 *                 description: The campaign associated with the lead.
 *               status:
 *                 type: string
 *                 example: "Contacted"
 *                 description: The status of the lead.
 *                 enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Pending', 'In Progress', 'Lost', 'Won', 'Duplicate']
 *               source:
 *                 type: string
 *                 example: "Online"
 *                 description: The source from where the lead was generated.
 *               company:
 *                 type: string
 *                 description: The ID of the company.
 *                 example: "60d2bc3d3c2d5f3b8b0d4eab"
 *               assignedTo:
 *                 type: string
 *                 description: The ID of the user who is assigned to manage the lead.
 *                 example: "60d2bc3d3c2d5f3b8b0d4eab"
 *               profile:
 *                 type: object
 *                 properties:
 *                   age:
 *                     type: number
 *                     example: 30
 *                   address:
 *                     type: string
 *                     example: "123 Main St, City, Country"
 *                   pinCode:
 *                     type: string
 *                     example: "123456"
 *                   state:
 *                     type: string
 *                     example: "California"
 *                   city:
 *                     type: string
 *                     example: "Los Angeles"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   sslcJoinYear:
 *                     type: number
 *                     example: 2005
 *                   sslcPassOutYear:
 *                     type: number
 *                     example: 2007
 *                   sslcScore:
 *                     type: number
 *                     example: 85
 *                   hscJoinYear:
 *                     type: number
 *                     example: 2008
 *                   hscPassOutYear:
 *                     type: number
 *                     example: 2010
 *                   hscScore:
 *                     type: number
 *                     example: 80
 *                   UGJoinYear:
 *                     type: number
 *                     example: 2011
 *                   UGPassOutYear:
 *                     type: number
 *                     example: 2015
 *                   UG_CGPA:
 *                     type: number
 *                     example: 8.5
 *                   PGJoinYear:
 *                     type: number
 *                     example: 2016
 *                   PGPassOutYear:
 *                     type: number
 *                     example: 2018
 *                   PG_CGPA:
 *                     type: number
 *                     example: 9.0
 *                   ieltsScore:
 *                     type: number
 *                     example: 7.5
 *                   pteToeflScore:
 *                     type: number
 *                     example: 80
 *                   germanScore:
 *                     type: number
 *                     example: 70
 *                   xiiEnglishScore:
 *                     type: number
 *                     example: 75
 *                   careerGapFrom:
 *                     type: number
 *                     example: 2016
 *                   careerGapTo:
 *                     type: number
 *                     example: 2017
 *                   experienceFrom:
 *                     type: number
 *                     example: 2018
 *                   experienceTo:
 *                     type: number
 *                     example: 2022
 *                   backlogs:
 *                     type: number
 *                     example: 2
 *                   targetIntake:
 *                     type: string
 *                     example: "Fall 2023"
 *                   programOfInterest:
 *                     type: string
 *                     example: "Master's in Computer Science"
 *                   countryOfInterest:
 *                     type: string
 *                     example: "Germany"
 *                   visaRefusal:
 *                     type: string
 *                     example: "No"
 *                   tuitionFeePreference:
 *                     type: number
 *                     example: 10000
 *     responses:
 *       200:
 *         description: Successfully updated the lead.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Invalid input, some fields might be missing or invalid.
 *       404:
 *         description: Lead not found.
 *       500:
 *         description: Error occurred while updating the lead.
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put("/updateprofile/:id", leadsController.UpdateLead);
/**
 * @swagger
 * /api/leads/assignlead/{leadId}/{userId}:
 *   put:
 *     summary: Assign a user to a lead
 *     description: Assigns a specific user to a lead and creates an activity log for the assignment.
 *     tags:
 *       - Leads 
*     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead to which the user is being assigned.
 *         schema:
 *           type: string
 *           example: "60c72b2f9f1b2c001fbb3c8a"
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user being assigned to the lead.
 *         schema:
 *           type: string
 *           example: "60d0fe4f5311236168a109cf"
 *     responses:
 *       200:
 *         description: Successfully assigned the user to the lead and saved the activity log.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "60c72b2f9f1b2c001fbb3c8a"
 *                 assignedTo:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cf"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                 status:
 *                   type: string
 *                   example: "Assigned"
 *       400:
 *         description: Bad request, missing parameters or invalid data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bad Request: Missing required fields"
 *       404:
 *         description: The lead or user was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error assigning user to lead"
   *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put("/assignlead/:leadId/:userId", leadsController.AssignUserToLead);
/**
 * @swagger
 * /api/leads/{leadId}/status:
 *   put:
 *     summary: Update the status of a lead.
 *     description: Updates the status of a lead and performs additional actions like creating a customer or sales record when the status is "Converted".
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: leadId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the lead to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [New, Contacted, Interested, Not Interested, Converted, Pending, In Progress, Lost, Won, Duplicate]
 *                 description: The new status of the lead.
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Lead status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lead:
 *                   $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Invalid status or bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Lead or company not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


router.put("/:leadId/status", leadsController.UpdateLeadStatus)
/**
 * @swagger
 * /api/leads/{leadId}/stages:
 *   put:
 *     summary: Update the stages of a lead.
 *     description: Updates the stages field of a lead in the database.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: leadId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the lead to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stages:
 *                 type: number
 *                 description: The new stages value for the lead.
 *             required:
 *               - stages
 *             example:
 *               stages: 3
 *     responses:
 *       200:
 *         description: Lead stages updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lead:
 *                   $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Bad request (e.g., invalid lead ID or stages).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Lead not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put("/:leadId/stages", leadsController.UpdateLeadStages);
/**
 * @swagger
 * /api/leads/leads/{id}:
 *   get:
 *     summary: Retrieve a lead by its ID.
 *     description: Fetches a lead from the database using its unique identifier. Includes populated fields for assigned user and campaign.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the lead to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead not found"
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve lead"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/leads/:id', leadsController.getLeadById);
/**
 * @swagger
 * /api/leads/deleteall:
 *   delete:
 *     summary: Delete all leads for a specific company.
 *     description: This endpoint deletes all leads associated with the given company ID.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: companyId
 *         description: The company ID for which the leads will be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: "66e1675aad0e5a07675470f8"
 *     responses:
 *       200:
 *         description: Successfully deleted the leads for the specified company.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully deleted 5 leads."
 *       404:
 *         description: No leads found for the specified company.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No leads found for the specified company."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An error occurred while deleting the leads."
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/deleteall', leadsController.deleteLeadsByCompany);
/**
 * @swagger
 * /api/leads/putleads/{id}:
 *   put:
 *     summary: Update details of an existing lead.
 *     description: This endpoint updates the fields of an existing lead. If certain critical fields are updated, the `untouched` field will be set to `false`.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The ID of the lead to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followUp:
 *                 type: string
 *                 example: "2025-01-25"
 *               notes:
 *                 type: string
 *                 example: "Lead is interested in the program."
 *               status:
 *                 type: string
 *                 enum: ["New", "Contacted", "Interested", "Not Interested", "Converted", "Pending", "In Progress", "Lost", "Won", "Duplicate"]
 *                 example: "Interested"
 *               untouched:
 *                 type: boolean
 *                 example: false
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Lead successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead updated successfully"
 *                 lead:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60c72b2f5f1b2b001f1d5c1b"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     status:
 *                       type: string
 *                       example: "Interested"
 *       400:
 *         description: Bad request, invalid field update or untouched field revert.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'The "untouched" field cannot be reverted to true once set to false.'
 *       404:
 *         description: Lead not found with the specified ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead not found"
 *       500:
 *         description: Server error during the update operation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Database error message"
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/putleads/:id',leadsController.updateLead);
/**
 * @swagger
 * /api/leads/leadsbycampaign/{campaignid}:
 *   get:
 *     summary: Get all leads associated with a specific campaign.
 *     description: This endpoint retrieves all the leads for a given campaign ID.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         description: The ID of the campaign for which leads are being fetched.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *     responses:
 *       200:
 *         description: List of leads associated with the campaign.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60c72b2f5f1b2b001f1d5c1b"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   email:
 *                     type: string
 *                     example: "johndoe@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   assignedTo:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60c72b2f5f1b2b001f1d5c1b"
 *                       firstName:
 *                         type: string
 *                         example: "Jane"
 *                       lastName:
 *                         type: string
 *                         example: "Doe"
 *                   campaignid:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60c72b2f5f1b2b001f1d5c1b"
 *                       name:
 *                         type: string
 *                         example: "2025 Intake"
 *                       description:
 *                         type: string
 *                         example: "Campaign for the 2025 intake."
 *       400:
 *         description: Invalid campaign ID format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid campaign ID format."
 *       404:
 *         description: No leads found for the given campaign ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No leads found for the given campaign ID."
 *       500:
 *         description: Server error during the lead retrieval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while fetching leads."
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/leadsbycampaign/:campaignid', leadsController.getLeadsByCampaignId);
/**
 * @swagger
 * /api/leads/getworkflowLeads/{Pipeline}:
 *   get:
 *     summary: Get all leads associated with a specific pipeline.
 *     description: This endpoint retrieves all leads with status "Converted" that are linked to a specific pipeline.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: Pipeline
 *         description: The ID of the pipeline for which leads are being fetched.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *     responses:
 *       200:
 *         description: List of leads associated with the pipeline.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60c72b2f5f1b2b001f1d5c1b"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   email:
 *                     type: string
 *                     example: "johndoe@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *                   assignedTo:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60c72b2f5f1b2b001f1d5c1b"
 *                       firstName:
 *                         type: string
 *                         example: "Jane"
 *                       lastName:
 *                         type: string
 *                         example: "Doe"
 *                   campaignid:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60c72b2f5f1b2b001f1d5c1b"
 *                       name:
 *                         type: string
 *                         example: "2025 Intake"
 *                       description:
 *                         type: string
 *                         example: "Campaign for the 2025 intake."
 *       400:
 *         description: Invalid Pipeline ID format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid Pipeline ID format."
 *       404:
 *         description: No campaign found for the given Pipeline ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No campaign found for the given Pipeline ID."
 *       500:
 *         description: Server error during the lead retrieval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while fetching leads."
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/getworkflowLeads/:Pipeline', leadsController.getworkflowLeads);
/**
 * @swagger
 * /api/leads/notes/{leadId}:
 *   put:
 *     summary: Add a note to a lead
 *     description: This endpoint adds a note (author and content) to a specific lead by its ID.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: leadId
 *         description: The ID of the lead to which the note is being added.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *                 example: "Jane Doe"
 *               content:
 *                 type: string
 *                 example: "This lead is showing a lot of interest in our services."
 *     responses:
 *       200:
 *         description: Note added successfully to the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note added successfully"
 *                 lead:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60c72b2f5f1b2b001f1d5c1b"
 *                     notes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           author:
 *                             type: string
 *                             example: "Jane Doe"
 *                           content:
 *                             type: string
 *                             example: "This lead is showing a lot of interest in our services."
 *       404:
 *         description: Lead not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Error adding note"
   *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/notes/:leadId', leadsController.addNoteToLead);
/**
 * @swagger
 * /api/leads/deletenotes:
 *   delete:
 *     summary: Delete a note from a lead
 *     description: This endpoint deletes a specific note from a lead using the leadId and noteId.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: leadId
 *         description: The ID of the lead from which the note is being deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *       - in: query
 *         name: noteId
 *         description: The ID of the note to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c2b"
 *     responses:
 *       200:
 *         description: Note deleted successfully from the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note deleted successfully"
 *                 lead:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60c72b2f5f1b2b001f1d5c1b"
 *                     notes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           author:
 *                             type: string
 *                             example: "Jane Doe"
 *                           content:
 *                             type: string
 *                             example: "This lead is showing a lot of interest in our services."
 *       404:
 *         description: Lead or note not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead or Note not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Error deleting note"
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.delete('/deletenotes', leadsController.deleteNoteFromLead);
/**
 * @swagger
 * /api/leads/deleteMultiLeads:
 *   delete:
 *     summary: Delete multiple leads by their IDs
 *     description: This endpoint allows you to delete multiple leads from the database by providing an array of lead IDs.
 *     tags:
 *       - Leads
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of lead IDs to be deleted
  *                 example: "60d5f8d9b8b9b926c8e8eb9b"
 *     responses:
 *       200:
 *         description: Successfully deleted the specified leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Items deleted successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     acknowledged:
 *                       type: boolean
 *                       example: true
 *                     deletedCount:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad request, the IDs provided are not in an array format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "IDs must be an array"
 *       500:
 *         description: Internal server error, failure during deletion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete items"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

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
/**
 * @swagger
 * /api/leads/assign-multiple/{userId}:
 *   put:
 *     summary: Assign multiple leads to a user
 *     description: This endpoint allows assigning multiple leads to a specified user by their IDs.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: userId
 *         description: The ID of the user to assign the leads to.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "60c72b2f5f1b2b001f1d5c2b"
 *                 description: List of lead IDs to be assigned to the user
 *     responses:
 *       200:
 *         description: Leads successfully assigned to the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "3 leads successfully assigned."
 *                 leads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60c72b2f5f1b2b001f1d5c1b"
 *                       assignedTo:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60c72b2f5f1b2b001f1d5c1c"
 *                           firstName:
 *                             type: string
 *                             example: "John"
 *                           lastName:
 *                             type: string
 *                             example: "Doe"
 *       400:
 *         description: Invalid lead IDs provided or no leads found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No lead IDs provided or invalid format."
 *       404:
 *         description: User not found or no leads found with provided IDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Error assigning leads to user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error assigning leads to user."
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.put('/assign-multiple/:userId',leadsController.AssignMultipleLeadsToUser);
/**
 * @swagger
 * /api/leads/upload:
 *   post:
 *     summary: Upload a file to the S3 bucket and associate it with a lead
 *     description: This endpoint allows a file to be uploaded to S3, and it associates the uploaded file with a specific lead in the database.
 *     tags:
 *       - Leads
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               docName:
 *                 type: string
 *                 description: Name of the document to be uploaded
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead to associate the file with
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       200:
 *         description: Successfully uploaded the file and associated it with the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 file:
 *                   type: object
 *                   properties:
 *                     leadId:
 *                       type: string
 *                       example: "60b8d295f7f8a73a7457be85"
 *                     createdBy:
 *                       type: string
 *                       example: "John Doe"
 *                     docName:
 *                       type: string
 *                       example: "Contract Document"
 *                     fileName:
 *                       type: string
 *                       example: "contract.pdf"
 *                     fileType:
 *                       type: string
 *                       example: "application/pdf"
 *                     fileUrl:
 *                       type: string
 *                       example: "https://my-bucket.s3.amazonaws.com/uuid-123456-contract.pdf"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 * 
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

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
/**
 * @swagger
* /api/leads/docs/bylead/{leadId}:
*   get:
*     summary: Get all documents associated with a lead
*     description: This endpoint fetches all the documents associated with a specific lead by its ID.
*     tags:
*       - Leads
*     parameters:
*       - in: path
*         name: leadId
*         required: true
*         description: The ID of the lead for which to fetch documents.
*         schema:
*           type: string
*           example: "60b8d295f7f8a73a7457be85"
*     responses:
*       200:
*         description: Successfully fetched the list of files for the given lead.
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 type: object
*                 properties:
*                   leadId:
*                     type: string
*                     example: "60b8d295f7f8a73a7457be85"
*                   createdBy:
*                     type: object
*                     properties:
*                       name:
*                         type: string
*                         example: "John Doe"
*                   docName:
*                     type: string
*                     example: "Contract Document"
*                   fileName:
*                     type: string
*                     example: "contract.pdf"
*                   fileType:
*                     type: string
*                     example: "application/pdf"
*                   fileUrl:
*                     type: string
*                     example: "https://my-bucket.s3.amazonaws.com/uuid-123456-contract.pdf"
*       500:
*         description: Internal server error.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 error:
*                   type: string
*                   example: "Error message"
*     security:
*       - bearerAuth: []
* components: 
*   securitySchemes:
*     bearerAuth:
*       type: http
*       scheme: bearer
*       bearerFormat: JWT
*/
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

/**
 * @swagger
 * /api/leads/leadInsight/{assigneeId}:
 *   get:
 *     summary: Get home insights for a specific assignee
 *     description: This endpoint returns the count of leads grouped by status for a specific assignee within a company.
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: path
 *         name: assigneeId
 *         description: The ID of the assignee for whom the lead counts are fetched.
 *         required: true
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2b001f1d5c1b"
 *     responses:
 *       200:
 *         description: Successfully fetched the lead counts for the assignee.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     New:
 *                       type: integer
 *                       example: 5
 *                     Contacted:
 *                       type: integer
 *                       example: 2
 *                     Interested:
 *                       type: integer
 *                       example: 1
 *                     Not Interested:
 *                       type: integer
 *                       example: 0
 *                     Converted:
 *                       type: integer
 *                       example: 3
 *                     Pending:
 *                       type: integer
 *                       example: 4
 *                     In Progress:
 *                       type: integer
 *                       example: 2
 *                     Lost:
 *                       type: integer
 *                       example: 1
 *                     Won:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Invalid assignee ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid Assignee ID"
 *       403:
 *         description: Unauthorized or invalid company information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: Invalid company information"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/leadInsight/:assigneeId' ,leadsController.homeInsight);
/**
 * @swagger
 * /api/leads/count-by-campaign:
 *   get:
 *     summary: Get leads count by campaign and status
 *     description: This endpoint returns the count of leads for each campaign, grouped by their statuses (e.g., New, Contacted, Converted, etc.).
 *     tags:
 *       - Leads
 *     responses:
 *       200:
 *         description: Successfully fetched the lead counts by campaign and status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       campaignid:
 *                         type: string
 *                         description: The ID of the campaign.
 *                         example: "60b8d295f7f8a73a7457be85"
 *                       totalLeads:
 *                         type: integer
 *                         description: The total number of leads in the campaign.
 *                         example: 50
 *                       unassigned:
 *                         type: integer
 *                         description: The number of unassigned leads in the campaign.
 *                         example: 5
 *                       new:
 *                         type: integer
 *                         description: The number of 'New' status leads in the campaign.
 *                         example: 10
 *                       contacted:
 *                         type: integer
 *                         description: The number of 'Contacted' status leads in the campaign.
 *                         example: 8
 *                       Converted:
 *                         type: integer
 *                         description: The number of 'Converted' status leads in the campaign.
 *                         example: 15
 *                       inProgress:
 *                         type: integer
 *                         description: The number of 'In Progress' status leads in the campaign.
 *                         example: 7
 *                       Interested:
 *                         type: integer
 *                         description: The number of 'Interested' status leads in the campaign.
 *                         example: 4
 *                       won:
 *                         type: integer
 *                         description: The number of 'Won' status leads in the campaign.
 *                         example: 2
 *                       lost:
 *                         type: integer
 *                         description: The number of 'Lost' status leads in the campaign.
 *                         example: 3
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/count-by-campaign',leadsController. getLeadsCountByCampaignAndStatus);
router.get('/count',leadsController.getLeadStatus)
router.put('/:id/tags/add', leadsController.addTagsToLead); // Add tags to lead
router.put('/:id/tags/remove', leadsController.removeTagsFromLead);
router.post("/headers", upload.single("file"), leadsController.getExcelHeaders);

module.exports = router;
