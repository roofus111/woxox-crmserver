const AWS = require('aws-sdk');
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create a new ticket with file upload
exports.createTicket = async (req, res) => {
  try {
    const {
      customerId,
      issueDetails,
      assignedTo,
      notes,
      sla,
    } = req.body;

    const files = req.files; // Assuming you're using a middleware like multer for file handling

    // Validate Customer ID
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate Assigned User (if provided)
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }
    }

    // Upload files to S3 and get URLs
    const uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileContent = file.buffer; // File content from multer
        const fileName = `${uuidv4()}-${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `ticketdoc/${uuidv4()}-${file.originalname}`,
          Body: fileContent,
          ContentType: file.mimetype
        };

        const uploadResult = await s3.upload(params).promise();
        uploadedFiles.push({
          fileName: fileName,
          fileType: file.mimetype,
          fileUrl: uploadResult.Location, // S3 file URL
        });
      }
    }

    // Create the new ticket
    const newTicket = new Ticket({
      customer: customerId,
      issue_details: {
        subject: issueDetails?.subject,
        description: issueDetails?.description,
        category: issueDetails?.category,
        sub_category: issueDetails?.sub_category || null,
        priority: issueDetails?.priority,
        attachments: uploadedFiles,
      },
      assignedTo: assignedTo || null,
      notes: notes || [],
      history: [
        {
          status: 'Open',
          changed_by: 'System', // Replace with logged-in user later
          timestamp: new Date(),
        },
      ],
      sla: sla || {},
    });

    // Save the ticket to the database
    const savedTicket = await newTicket.save();
    return res.status(201).json({ message: 'Ticket created successfully', ticket: savedTicket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
