const Task = require('../models/Task');
const { v4: uuidv4 } = require('uuid');
const { S3, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const newTask = new Task(req.body);
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignee').populate('leadId');
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignee')
            .populate('leadId')
            .populate('tagIds', null, 'TagManager');
            
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        ).populate('assignee').populate('leadId');
        
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reassign task to a different user
exports.reassignTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { newAssigneeId } = req.body;

        // Find the task and update the assignee
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { assignee: newAssigneeId },
            { new: true }
        ).populate('assignee').populate('leadId');

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Add to activity log
        updatedTask.activityLog.push({
            performedBy: req.user._id,
            action: 'reassigned',
            referenceData: {
                previousAssignee: updatedTask.assignee,
                newAssignee: newAssigneeId
            }
        });

        await updatedTask.save();

        res.status(200).json({
            message: 'Task reassigned successfully',
            task: updatedTask
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search and filter tasks
exports.searchAndFilterTasks = async (req, res) => {
    try {
        const {
            tagIds,
            leadId,
            priority,
            status,
            assignee,
            startDate,
            endDate,
            createdStartDate,
            createdEndDate
        } = req.query;

        // Build the filter object
        const filter = {};

        // Filter by tags
        if (tagIds) {
            const tagArray = Array.isArray(tagIds) ? tagIds : [tagIds];
            filter.tagIds = { $in: tagArray };
        }

        // Filter by lead
        if (leadId) {
            filter.leadId = leadId;
        }

        // Filter by priority
        if (priority) {
            filter.priority = priority;
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Filter by assignee
        if (assignee) {
            filter.assignee = assignee;
        }

        // Filter by due date range
        if (startDate || endDate) {
            filter.dueDate = {};
            if (startDate) {
                filter.dueDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.dueDate.$lte = new Date(endDate);
            }
        }

        // Filter by creation date range
        if (createdStartDate || createdEndDate) {
            filter.createdAt = {};
            if (createdStartDate) {
                filter.createdAt.$gte = new Date(createdStartDate);
            }
            if (createdEndDate) {
                filter.createdAt.$lte = new Date(createdEndDate);
            }
        }

        // Execute the query with populated fields
        const tasks = await Task.find(filter)
            .populate('assignee')
            .populate('leadId')
            .populate('tagIds', null, 'TagManager')
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload file to task
exports.uploadTaskFile = async (req, res) => {
    try {
        const { taskId } = req.params;
        const file = req.file; // Assuming multer middleware is used

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Generate unique file name
        const fileName = `${uuidv4()}-${file.originalname}`;
        
        // Upload to S3 using AWS SDK v3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `taskfiles/${fileName}`,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        // Create S3 client instance
        const s3 = new S3({ client: s3Client });
        
        // Upload file using PutObjectCommand
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // Construct the S3 URL
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/task-files/${fileName}`;

        // Create file object
        const fileData = {
            filename: fileName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: fileUrl,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        };

        // Add file to task's files array
        task.files.push(fileData);
        await task.save();

        // Add to activity log
        task.activityLog.push({
            performedBy: req.user._id,
            action: 'file_uploaded',
            referenceData: {
                fileName: file.originalname,
                fileUrl: fileUrl
            }
        });

        await task.save();

        res.status(200).json({
            message: 'File uploaded successfully',
            file: fileData
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

// Delete file from task
exports.deleteTaskFile = async (req, res) => {
    try {
        const { taskId, fileId } = req.params;

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Find the file in the task's files array
        const fileIndex = task.files.findIndex(file => file._id.toString() === fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ message: 'File not found in task' });
        }

        const fileToDelete = task.files[fileIndex];

        // Delete from S3
        const fileKey = fileToDelete.filename; // This is the filename we stored
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `taskfiles/${fileKey}` // Using taskfiles/ to match upload path
        };

        try {
            // Delete file using DeleteObjectCommand
            const command = new DeleteObjectCommand(params);
            await s3Client.send(command);
        } catch (s3Error) {
            console.error('Error deleting file from S3:', s3Error);
            return res.status(500).json({ 
                message: 'Error deleting file from S3', 
                error: s3Error.message 
            });
        }

        // Remove file from task's files array
        task.files.splice(fileIndex, 1);

        // Add to activity log
        task.activityLog.push({
            performedBy: req.user._id,
            action: 'file_deleted',
            referenceData: {
                fileName: fileToDelete.originalName,
                fileUrl: fileToDelete.path
            }
        });

        await task.save();

        res.status(200).json({
            message: 'File deleted successfully',
            deletedFile: fileToDelete
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
};

