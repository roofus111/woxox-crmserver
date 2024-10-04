const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Lead = require('../models/Lead');

const authenticateUser = require('../middleware/authenticateUser');
const authorizeCompanyAccess = require('../middleware/authorizeCompanyAccess');

const router = express.Router();
router.use(authenticateUser);

const upload = multer({
  dest: 'uploads/' // Temporary directory for file uploads
});

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
    const leadsPromises = jsonData.map(async data => {
      const leadData = {
        name: data.Name || data.name || data["full name"],
        email: data.Email || data.email,
        phone: data.Phone || data.phone || data.phone_number,
        status: 'New',
        source: req.body.source,
        campaign: req.body.campaign,
        company: req.user.company._id,
        assignedTo: null
      };

      if (!leadData.name || !leadData.company || !leadData.phone) {
        console.error('Missing required lead data', leadData);
        return;
      }

      // Check for duplicate in the database
      const existingLead = await Lead.findOne({
        $or: [
          { phone: leadData.phone }
        ]
      });
            if (existingLead) {
        duplicateLeads.push(leadData);
        return;
      }

      return new Lead(leadData).save();
    });

    await Promise.all(leadsPromises);
    res.status(200).json({
      message: 'Leads processed successfully',
      duplicates: duplicateLeads
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
