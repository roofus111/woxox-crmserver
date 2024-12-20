const AWS = require('aws-sdk');
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names
const {S3} = require("@aws-sdk/client-s3")
const s3Client = require("../config/s3")
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
      assignedTo,
      notes,
      sla,
      subject,
      description,
      category,
      sub_category,
      priority,
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
        subject: subject,
        description: description,
        category:category,
        sub_category: sub_category || null,
        priority:priority,
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

// Get tickets (with filters or by ID)
exports.getTickets = async (req, res) => {
  try {
    const { ticketId, customerId, assignedTo, status, priority } = req.query;

    // If a specific ticket ID is provided, fetch the ticket by ID
    if (ticketId) {
      const ticket = await Ticket.findById(ticketId)
        .populate('customer') // Populate customer details
        .populate('assignedTo'); // Populate assigned user details

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      return res.status(200).json(ticket);
    }

    // Build a query object for filtering
    const query = {};
    if (customerId) query.customer = customerId;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query['history.status'] = status;
    if (priority) query['issue_details.priority'] = priority;

    // Fetch tickets with applied filters
    const tickets = await Ticket.find(query)
      .populate('customer') // Populate customer details
      .populate('assignedTo'); // Populate assigned user details

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'No tickets found' });
    }

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Find the ticket by ID and populate related fields
    const ticket = await Ticket.findById(ticketId)
      .populate('customer') // Populate customer details
      .populate('assignedTo'); // Populate assigned user details

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Function to handle fetching file from ticket attachments
exports.getAttachmentById = async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;

    // Find the ticket by ID
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Find the attachment by ID within the ticket
    const attachment = ticket.issue_details.attachments.id(attachmentId);

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // S3 parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: "ticketdoc/" + attachment.fileUrl.split("/").pop(), // Extract the key from the file URL
    };

    // Create an instance of S3 client
    // const s3 =new AWS.S3();
    const aws = new S3({client:s3Client});

    // Get the file from S3
    const data = await aws.getObject(params)

    // Set the response headers
    res.setHeader("Content-Type", attachment.fileType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.fileName}"`
    );

    // Pipe the data to the response
    data.Body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};




