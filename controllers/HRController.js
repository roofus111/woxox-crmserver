const AWS = require('aws-sdk');
const Employee=require('../models/HR')
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names
const {S3} = require("@aws-sdk/client-s3")
const s3Client = require("../config/s3")
const { isValid, parseISO, format } = require('date-fns');
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
          // Add a history entry for employee creation
    const historyEntry = {
      activityType: 'Status Update', // Or a more specific type like "Employee Created"
      description: `Employee ${firstName} ${lastName} was created by ${req.user.name}`,
      changedBy: req.user._id, // The user who created the employee
      changedAt: new Date()
    };

    // Add the history entry to the employee's history array
    savedEmployee.history.push(historyEntry);
    await savedEmployee.save();
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


exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; // Employee ID from request params
    const updates = req.body; // Fields to update from the request body

    // Find the employee and get the old data
    const oldEmployeeData = await Employee.findById(employeeId);
    if (!oldEmployeeData) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update the employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updates }, // Use `$set` for partial updates
      { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators` ensures schema validation
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Determine which fields were changed
    const changedFields = [];
    for (const key in updates) {
      if (oldEmployeeData[key] !== updatedEmployee[key]) {
        changedFields.push(key);
      }
    }

    // If no fields were changed, return early
    if (changedFields.length === 0) {
      return res.status(200).json({ message: 'No changes detected', employee: updatedEmployee });
    }

    // Create a history entry for the update
    const historyEntry = {
      activityType: 'Employee Updated', // Specific activity type
      description: `Employee ${updatedEmployee.firstName} ${updatedEmployee.lastName}'s data changed by ${req.user.name || req.user.email}: ${changedFields.join(', ')}`,
      changedBy: req.user._id, // The user who made the changes
      changedAt: new Date()
    };

    // Add the history entry to the employee's history array
    updatedEmployee.history.push(historyEntry);
    await updatedEmployee.save();

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

    // Find the employee and get the old data
    const oldEmployeeData = await Employee.findById(employeeId);
    if (!oldEmployeeData) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update the employee's status
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { status }, // Update the status
      { new: true } // Return the updated document
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create a history entry for the status update
    const historyEntry = {
      activityType: 'Status Update', // Specific activity type
      description: `Employee ${updatedEmployee.firstName} ${updatedEmployee.lastName}'s status changed from ${oldEmployeeData.status} to ${status} by ${req.user.name || req.user.email}.`, // Include employee name, old status, new status, and user
      changedBy: req.user._id, // The user who made the change
      changedAt: new Date(),
      oldValue: oldEmployeeData.status, // Old status
      newValue: status, // New status
    };

    // Add the history entry to the employee's history array
    updatedEmployee.history.push(historyEntry);
    await updatedEmployee.save();

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
    const { status } = req.body; // Status filter from query params

    // Validate the status
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Active or Inactive.' });
    }

    // Find employees by status
    const employees = await Employee.find({  company: req.user.company._id ,status });
    if (employees.length === 0) {
      return res.status(404).json({ message: `No ${status} employees found.` });
    }

    return res.status(200).json({
      message: `List of ${status} employees`,
      count: employees.length,
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


// Create a new attendance record with leave details
exports.Addattendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, leaves } = req.body;
      // Validate date format
    // Validate date format (YYYY-MM-DD)
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }
        // Validate time format (basic check)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format
    if (!timeRegex.test(checkInTime) || !timeRegex.test(checkOutTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM.",
      });
    }
    // Find the employee by ID
    const employee = await Employee.findById(employeeId);
    if (!employee) { 
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    // Check if attendance already exists for the same date
    const existingAttendance = employee.attendence.find((attendance) =>
      new Date(attendance.date).toISOString().split('T')[0] === date
    );
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this date.' });
    }

    // Validate check-in and check-out times
    if (checkOutTime <= checkInTime) {
      return res.status(400).json({ message: 'Check-out time must be after check-in time.' });
    }
    // Create a new attendance record
    const newAttendance = {
      company:req.user.company?._id, 
      date,
      checkInTime,
      checkOutTime,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If leaveDetails are provided, add them to the attendance record
    if (leaves) {
      newAttendance.leaves = [leaves];
    }

    // Add the attendance record to the employee's attendance array
    employee.attendence.push(newAttendance);
    const historyRecord = new AttendanceHistory({
      activityType: 'Attendance Added', // Or a more specific type like "Employee Created"
      description: `Employee ${firstName} ${lastName} attendance was posted by ${req.user.name}`,
      changedBy: req.user._id, // The user who created the employee
      changedAt: new Date()
    });

    // Save the history record
    await historyRecord.save()
    // Save the updated employee document
    const updatedEmployee = await employee.save();

    // Respond with the updated employee data
    res.status(201).json({
      success: true,
      message: "Attendance record created successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Error creating attendance record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create attendance record",
      error: error.message,
    });
  }
};
// Get Attendance of All Employees
exports.getAllAttendances = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Fetch all employees and their attendance records
    let employees = await Employee.find({})
      .select('firstName lastName attendence') // Select only relevant fields
      .populate('attendence.leaves'); // Populate leave details if needed

    if (!employees.length) {
      return res.status(404).json({ message: 'No employees found.' });
    }

    // Filter attendance records for each employee by date range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date();

      employees = employees.map(employee => {
        const filteredAttendance = employee.attendence.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate <= end;
        });

        return {
          employeeId: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          attendance: filteredAttendance,
        };
      });
    } else {
      // If no date range is provided, return all attendance records
      employees = employees.map(employee => ({
        employeeId: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        attendance: employee.attendence,
      }));
    }

    return res.status(200).json({
      message: 'Attendance records retrieved successfully.',
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
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
exports.getAttendanceByIdStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, status } = req.body;

    // Example list of holidays (can be fetched from a database or configuration file)
    const holidays = [];

    // Validate employeeId
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    // Validate status if provided
    if (status && !["Present", "Absent", "On Leave"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be Present, Absent, or On Leave."
      });
    }

    // Find the employee
    const employee = await Employee.findById(employeeId).populate("attendence.leaves");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Filter attendance records
    let filteredAttendance = employee.attendence;

    // Filter by date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();

      filteredAttendance = filteredAttendance.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }

    // Filter by status if provided
    if (status) {
      filteredAttendance = filteredAttendance.filter((record) => record.status === status);
    }

    // Count attendance by status
    const statusCounts = filteredAttendance.reduce(
      (counts, record) => {
        counts[record.status] = (counts[record.status] || 0) + 1;
        return counts;
      },
      { Present: 0, Absent: 0, "On Leave": 0 }
    );

    // Filter holidays within the date range
    const start = startDate ? new Date(startDate) : new Date("1970-01-01");
    const end = endDate ? new Date(endDate) : new Date();
    const filteredHolidays = holidays.filter((holiday) => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= start && holidayDate <= end;
    });

    // Return filtered records with counts
    return res.status(200).json({
      message: "Attendance records retrieved successfully.",
      attendance: filteredAttendance,
      holidays: filteredHolidays,
      counts: {
        present: statusCounts.Present,
        absent: statusCounts.Absent,
        onLeave: statusCounts["On Leave"],
        holidays: filteredHolidays.length
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message
    });
  }
};
exports.updateAttendanceById = async (req, res) => {
  try {
    const { employeeId, attendanceId } = req.params; // Employee and Attendance IDs from params
    const updateData = req.body; // Updated fields in the request body

    // Validate required parameters
    if (!employeeId || !attendanceId) {
      return res.status(400).json({ message: 'Employee ID and Attendance ID are required.' });
    }

    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Find the specific attendance record
    const attendanceRecord = employee.attendence.id(attendanceId);
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Update the fields in the attendance record
    Object.keys(updateData).forEach((key) => {
      attendanceRecord[key] = updateData[key];
    });

    // Save the updated employee document
    await employee.save();

    return res.status(200).json({
      message: 'Attendance record updated successfully.',
      updatedAttendance: attendanceRecord,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};



















