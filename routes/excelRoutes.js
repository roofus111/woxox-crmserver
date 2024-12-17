const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');
const Customer = require("../models/Customer")

const authenticateUser = require('../middleware/authenticateUser');
const authorizeCompanyAccess = require('../middleware/authorizeCompanyAccess');

const router = express.Router();
router.use(authenticateUser);

const upload = multer({
  dest: 'uploads/' // Temporary directory for file uploads
});

// router.post('/upload', authorizeCompanyAccess, upload.single('file'), async (req, res) => {
//   const filePath = path.join(__dirname, '..', req.file.path);
//   if (!req.file) {
//     return res.status(400).send('No file uploaded');
//   }

//   try {
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     const duplicateLeads = []; // Array to store duplicates
//     const leadsPromises = jsonData.map(async data => {
//       const leadData = {
//         name: data.Name || data.name || data["full name"] || data.full_name,
//         email: data.Email || data.email,
//         phone: data.Phone || data.phone || data.phone_number,
//         status: 'New',
//         source: req.body.source,
//         campaign: req.body.campaign,
//         campaignid : req.body.campaignid, 
//         company: req.user.company._id, 
//         assignedTo: null,
//         additionalFields: {
//           //add additional fields here
//         }
//       }

//       Object.keys(data).forEach(key => {
//         if (['which_level_are_you_at_right_now?','what_job_are_you_looking_for_in_luxembourg?',
//           'how_many_years_of_minimum_experience_you_have_in_the_same_field?','what_is_your_highest_educational_qualification?'
//         ].includes(key)) {
//           leadData.additionalFields[key] = data[key];
//         }
//       });


//       if (!leadData.name || !leadData.company || !leadData.phone) {
//         console.error('Missing required lead data', leadData);
//         return;
//       }

//       // Check for duplicate in the database
//       const existingLead = await Lead.findOne({
//         $or: [
//           { phone: leadData.phone }
//         ]
//       });
//             if (existingLead) {
//         duplicateLeads.push(leadData);
//         return;
//       }

//       return new Lead(leadData).save();
//     });

//     await Promise.all(leadsPromises);
//     res.status(200).json({
//       message: 'Leads processed successfully',
//       duplicates: duplicateLeads
//     });
//   } catch (error) {
//     console.error('Error processing file:', error.message);
//     res.status(500).send('An error occurred while processing the file');
//   } finally {
//     // Clean up the uploaded file regardless of the outcome
//     fs.unlink(filePath, err => {
//       if (err) console.error('Failed to delete the uploaded file:', err.message);
//     });
//   }
// });

// module.exports = router;
router.post('/upload', authorizeCompanyAccess, upload.single('file'), async (req, res) => {
  const filePath = path.join(__dirname, '..', req.file.path);
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const duplicateLeads = []; // Array to store duplicates
    const existingCustomers = []; // Array to store existing customers with their ID
    const leadsPromises = jsonData.map(async data => {
      const leadData = {
        name: data.Name || data.name || data["full name"] || data.full_name,
        email: data.Email || data.email,
        phone: data.Phone || data.phone || data.phone_number,
        status: 'New',
        source: req.body.source,
        campaign: req.body.campaign,
        campaignid: req.body.campaignid,
        company: req.user.company._id,
        assignedTo: null,
        additionalFields: {
          // Add additional fields here
        }
      };

      // Map additional fields if present
      Object.keys(data).forEach(key => {
        if (['which_level_are_you_at_right_now?', 'what_job_are_you_looking_for_in_luxembourg?',
          'how_many_years_of_minimum_experience_you_have_in_the_same_field?',
          'what_is_your_highest_educational_qualification?'].includes(key)) {
          leadData.additionalFields[key] = data[key];
        }
      });

      // Validate required fields
      if (!leadData.name || !leadData.phone) {
        console.error('Missing required lead data', leadData);
        return;
      }

      // Check for an existing customer (based on email or phone)
      const existingCustomer = await Customer.findOne({
        $or: [
          { email: leadData.email },
          { phone: leadData.phone }
        ]
      });
console.log(existingCustomer);

      if (existingCustomer) {
        leadData.Customer = existingCustomer._id;  // Add customer ID to lead data
        existingCustomers.push(leadData);  // Save the lead with customer ID
      }

      // Check for duplicate lead in the leads collection
      const existingLead = await Lead.findOne({ phone: leadData.phone, companyId: req.body.campaignid  });

      if (existingLead) {
        duplicateLeads.push(leadData);
        return;
      }
      // Save the new lead (whether existing customer or not)
      return new Lead(leadData).save();
    });


    await Promise.all(leadsPromises);

    res.status(200).json({
      message: 'Leads processed successfully',
      duplicates: duplicateLeads,
      // existingCustomers: existingCustomers  // Include existing customers with their IDs
    });
  } catch (error) {
    console.error('Error processing file:', error.message);
    res.status(500).send('An error occurred while processing the file');
  } finally {
    // Clean up the uploaded file regardless of the outcome
    fs.unlink(filePath, err => {
      if (err) console.error('Failed to delete the uploaded file:', err.message);
    });
  }
});
module.exports = router;
