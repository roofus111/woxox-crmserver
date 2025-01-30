const AWS = require('aws-sdk');
const Employee=require('../models/HR')
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names
const {S3} = require("@aws-sdk/client-s3")
const s3Client = require("../config/s3")
const mongoose =require("mongoose")
// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
// Create a new Employee

exports.createEmployee = async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        gender,
        address,
        startDate,
        endDate,
        status,
        jobTitle,
        department,
        role,
        supervisor,
        attendence,
        payroll,
        performance,
        training,
        salary,//*
      } = req.body;
  
      const files = req.files; // Assuming you're using a middleware like multer for file handling
  
      // Validate supervisor (if provided)
      if (supervisor) {
        const supervisorExists = await Employee.findById(supervisor);
        if (!supervisorExists) {
          return res.status(404).json({ message: 'Supervisor not found' });
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
          Key: `employeedoc/${uuidv4()}-${file.originalname}`,
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
  
      // Create a new employee
      const newEmployee = new Employee({
        company:req.user.company?._id,
        User:req.user._id,
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        gender,
        address,
        startDate,
        endDate,
        status: status || 'Active',
        jobTitle,
        department,
        role,
        attachments: uploadedFiles,
        supervisor: supervisor || null,
        attendence, // This can be an array of attendance records (e.g., { date, status, checkInTime })
        payroll, // Array of payroll records (e.g., { basicSalary, netSalary, paymentDate })
        performance, // Array of performance records (e.g., { reviewDate, rating, feedback })
        training, // Array of training records (e.g., { trainingName, startDate, endDate })
        salary,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      // Save the employee to the database
      const savedEmployee = await newEmployee.save();
      return res.status(201).json({ message: 'Employee created successfully', employee: savedEmployee });
    } catch (error) {
      console.error('Error creating employee:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  };


// Get Employee(s) Controller
exports.getEmployee = async (req, res) => {
  try {
    const { EmployeeId } = req.params; // ID for fetching a single employee
    const { page = 1, limit = 10, status, department, role } = req.query; // Pagination and filtering

    if (EmployeeId) {
      // Fetch a single employee by ID
      const employee = await Employee.findById(EmployeeId)
        .populate('company', 'name') // Populating company details (adjust as needed)
        .populate('User', 'email') // Populating user details
        .populate('supervisor', 'firstName lastName') // Populating supervisor details
        .populate('attendence') // Populating attendance
        .populate('payroll') // Populating payroll
        .populate('performance') // Populating performance
        .populate('training') // Populating training


      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      return res.status(200).json({ employee });
    } else {
      // Fetch all employees with optional filters
      const filter = {company: req.user.company._id};
      if (status) filter.status = status;
      if (department) filter.department = department;
      if (role) filter.role = role;

      const employees = await Employee.find(filter)
        .populate('company', 'name')
        .populate('User', 'email')
        .populate('supervisor', 'firstName lastName')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalEmployees = await Employee.countDocuments(filter);

      return res.status(200).json({
        employees,
        total: totalEmployees,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }
  } catch (error) {
    console.error('Error fetching employee(s):', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Update Employee Controller
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; // Employee ID from request params
    const updates = req.body; // Fields to update from the request body

    // Find and update the employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updates }, // Use `$set` for partial updates
      { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators` ensures schema validation
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.status(200).json({ message: 'Employee updated successfully', employee: updatedEmployee });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params; // Employee ID from request params
    const { status } = req.body; // Status from request body

    // Validate the status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Active or Inactive.' });
    }

    // Find and update the employee's status
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { status },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.status(200).json({
      message: `Employee status updated to ${status}`,
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Error updating employee status:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
exports.getEmployeesByStatus = async (req, res) => {
  try {
    const { status } = req.query; // Status filter from query params

    // Validate the status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Active or Inactive.' });
    }

    // Find employees by status
    const employees = await Employee.find({ status });

    return res.status(200).json({
      message: `List of ${status} employees`,
      employees,
    });
  } catch (error) {
    console.error('Error fetching employees by status:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


//Attachment details
//create attachment
exports.postAttachment = async (req, res) => {
  try {
    const { employeeId } = req.params; // Employee ID from the request
    const files = req.files; // Files from the request (Multer middleware)

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Find the employee by ID
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Upload files to S3 and get URLs
    const uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileContent = file.buffer; // File content from multer
        const fileName = `${uuidv4()}-${file.originalname}`; 
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `employeedoc/${uuidv4()}-${file.originalname}`,
          Body: fileContent,
          ContentType: file.mimetype
        };

        const uploadResult = await s3.upload(params).promise();
        uploadedFiles.push({
          fileName: fileName,
          fileType: file.mimetype,
          fileUrl: uploadResult.Location,
        });
      }
    }

    // Add the uploaded files to the employee's attachments
    employee.attachments.push(...uploadedFiles);

    // Save the employee document
    await employee.save();

    return res
      .status(201)
      .json({ message: 'Files uploaded successfully', attachments: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Get Attachment by ID Controller
exports.getAttachmentById = async (req, res) => {
  try {
    const { employeeId, attachmentId } = req.params; // Employee and attachment IDs from request params

    // Find the employee by ID
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Find the specific attachment by ID
    const attachment = employee.attachments.id(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
   // S3 parameters
   const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: "employeedoc/" + attachment.fileUrl.split("/").pop(), // Extract the key from the file URL
  };
  // Create an instance of S3 client
  const aws = new S3({client:s3Client});
  
  // Get the file from S3
  const data = await aws.getObject(params)

    // Return the attachment details
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

exports.deleteAttachment = async (req, res) => {
  const { employeeId, attachmentId } = req.params; // Employee ID and Attachment ID from the request

  try {
    // Find the employee by ID
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Find the attachment by its ID
    const attachment = employee.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Get the S3 key from the attachment URL
    const key = attachment.fileUrl.split('.com/')[1];

    // Delete the file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    
    await s3.deleteObject(params).promise();

    // Remove the attachment from the employee's attachments array
    employee.attachments.pull(attachmentId);

    // Save the updated employee document
    await employee.save();

    return res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

//attendance

// Create Attendance Record
exports.addAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, leaves } = req.body;

    // Validate required fields
    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and Date are required.' });
    }

    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Add new attendance record
    const newAttendance = {
      date,
      checkInTime,
      checkOutTime,
      status,
      leaves,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Push to the attendance array in the employee schema
    employee.attendence.push(newAttendance);

    // Save the employee document
    await employee.save();

    return res.status(201).json({ message: 'Attendance record added successfully.', attendance: newAttendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

// Get Attendance Records
exports.getAttendancebyid = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {  startDate, endDate } = req.body;

    // Check if employeeId is provided
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required.' });
    }

    // Find the employee
    const employee = await Employee.findById(employeeId).populate('attendence.leaves');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Filter attendance by date range if startDate and endDate are provided
    let filteredAttendance = employee.attendence;

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date();

      filteredAttendance = filteredAttendance.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }
   
    // Return filtered attendance records
    return res.status(200).json({
      message: 'Attendance records retrieved successfully.',
      attendance: filteredAttendance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

















