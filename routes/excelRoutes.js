const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const Lead = require("../models/Lead");
const Customer = require("../models/Customer");

const authenticateUser = require("../middleware/authenticateUser");
const authorizeCompanyAccess = require("../middleware/authorizeCompanyAccess");

const router = express.Router();
router.use(authenticateUser);

const upload = multer({
  dest: "uploads/", // Temporary directory for file uploads
});

// module.exports = router;
/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload an Excel file to process leads
 *     description: Upload an Excel file, process the lead data, check for duplicates and existing customers, and save the leads to the database.
 *     tags:
 *       - LeadExcel
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *                 description: The source of the lead (e.g., 'LinkedIn', 'Referral')
 *                 example: 'LinkedIn'
 *               campaign:
 *                 type: string
 *                 description: Campaign name associated with the leads
 *                 example: 'New Year Campaign'
 *               campaignid:
 *                 type: string
 *                 description: The ID of the campaign
 *                 example: '60b8d295f7f8a73a7457be85'
  *               file:
 *                 type: string
 *                 format: binary
  *                 description: Excel file to upload
 *     responses:
 *       200:
 *         description: Successfully processed the leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leads processed successfully
 *                 duplicates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *       400:
 *         description: Bad request - No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No file uploaded
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while processing the file
 *     consumes:
 *       - multipart/form-data
 *     produces:
 *       - application/json
  *     security:
 *       - bearerAuth: []
 * components: 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.post(
  "/upload",
  authenticateUser,
  upload.single("file"),
  async (req, res) => {
    const filePath = path.join(__dirname, "..", req.file.path);
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const duplicateLeads = []; // Array to store duplicates
      const existingCustomers = []; // Array to store existing customers with their ID
      const leadsPromises = jsonData.map(async (data) => {
        const leadData = {
          name:
            data.Name ||
            data.name ||
            data["full name"] ||
            data.full_name ||
            data["Full Name"],
          email: data.Email || data.email,
          phone:
            data.Phone ||
            data.phone ||
            data.phone_number ||
            data["Phone Number"],
          status: "New",
          source: req.body.source,
          campaign: req.body.campaign,
          campaignid: req.body.campaignid,
          company: req.user.company._id,
          assignedTo: null,
          district:data.District ,
          additionalFields: {
            // Add additional fields here
          },
        };

        // Map additional fields if present
        Object.keys(data).forEach((key) => {
          if (
            [
              "which_level_are_you_at_right_now?",
              "what_job_are_you_looking_for_in_luxembourg?",
              "how_many_years_of_minimum_experience_you_have_in_the_same_field?",
              "what_is_your_highest_educational_qualification?",
              "country_of_interest"
            ].includes(key)
          ) {
            leadData.additionalFields[key] = data[key];
          }
        });

        // Validate required fields
        if (!leadData.name || !leadData.phone) {
          console.error("Missing required lead data", leadData);
          return;
        }

        // Check for an existing customer (based on email or phone)
        const existingCustomer = await Customer.findOne({
          $or: [{ phone: leadData.phone }],
        });

        if (existingCustomer) {
          leadData.Customer = existingCustomer._id; // Add customer ID to lead data
          existingCustomers.push(leadData); // Save the lead with customer ID
        }
        console.log(req.user.company._id);

        // Check for duplicate lead in the leads collection
        const existingLead = await Lead.findOne({
          phone: leadData.phone,
          company: req.user.company._id,
          campaignid: leadData.campaignid,
        });
        console.log("no null", existingLead);

        if (existingLead) {
          duplicateLeads.push(leadData);
          return;
        }
        return new Lead(leadData).save();
      });

      await Promise.all(leadsPromises);

      res.status(200).json({
        message: "Leads processed successfully",
        duplicates: duplicateLeads,
        // existingCustomers: existingCustomers  // Include existing customers with their IDs
      });
    } catch (error) {
      console.error("Error processing file:", error.message);
      res.status(500).send("An error occurred while processing the file");
    } finally {
      // Clean up the uploaded file regardless of the outcome
      fs.unlink(filePath, (err) => {
        if (err)
          console.error("Failed to delete the uploaded file:", err.message);
      });
    }
  }
);
module.exports = router;
