const Task = require('../models/Task');
const TaskCount = require('../models/taskcount');
const { v4: uuidv4 } = require('uuid');
const { S3, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");
const MonthlyTaskMetrics = require('../models/MonthlyTaskMetrics');
const cron = require('node-cron');
const Company = require('../models/Company');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const newTask = new Task({
            ...req.body,
            company: req.user.company._id
        });

        // Add initial activity log entry
        newTask.activityLog.push({
            performedBy: req.user._id,
            action: 'created',
            referenceData: {
                initialStatus: newTask.status,
                initialPriority: newTask.priority,
                initialAssignee: newTask.assignee
            }
        });

        const savedTask = await newTask.save();

        // Update task count
        let taskCount = await TaskCount.findOne();
        if (!taskCount) {
            taskCount = new TaskCount();
        }

        // Increment total tasks
        taskCount.totalTasks++;

        // Update status count
        if (savedTask.status) {
            taskCount.statusCounts[savedTask.status]++;
        }

        // Update priority count
        if (savedTask.priority) {
            taskCount.priorityCounts[savedTask.priority.toLowerCase()]++;
        }

        // Update assignee count
        if (savedTask.assignee) {
            const assigneeIndex = taskCount.assigneeCounts.findIndex(
                ac => ac.assignee.toString() === savedTask.assignee.toString()
            );
            if (assigneeIndex > -1) {
                taskCount.assigneeCounts[assigneeIndex].count++;
            } else {
                taskCount.assigneeCounts.push({
                    assignee: savedTask.assignee,
                    count: 1
                });
            }
        }

        // Update lead count if task is associated with a lead
        if (savedTask.leadId) {
            const leadIndex = taskCount.leadCounts.findIndex(
                lc => lc.lead.toString() === savedTask.leadId.toString()
            );
            if (leadIndex > -1) {
                taskCount.leadCounts[leadIndex].count++;
            } else {
                taskCount.leadCounts.push({
                    lead: savedTask.leadId,
                    count: 1
                });
            }
        }

        // Update last updated timestamp
        taskCount.lastUpdated = new Date();

        await taskCount.save();

        res.status(201).json({
            ...savedTask.toObject(),
            company: req.user.company._id
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ company: req.user.company._id })
            .populate('assignee', 'name')
            .populate('leadId', 'name');
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignee', 'name')
            .populate('leadId', 'name')
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
        // Get the old task to check status change
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Track changes for activity log
        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (oldTask[key]?.toString() !== req.body[key]?.toString()) {
                changes[key] = {
                    from: oldTask[key],
                    to: req.body[key]
                };
            }
        });

        // Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('assignee', 'name').populate('leadId', 'name');

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Add activity log entry for the changes
        if (Object.keys(changes).length > 0) {
            updatedTask.activityLog.push({
                performedBy: req.user._id,
                action: 'updated',
                referenceData: {
                    changes: changes
                }
            });
            await updatedTask.save();
        }

        // If status has changed, update the counts
        if (oldTask.status !== updatedTask.status) {
            // Get or create the task count document
            let taskCount = await TaskCount.findOne();
            if (!taskCount) {
                taskCount = new TaskCount();
            }

            // Decrement the count for the old status
            if (oldTask.status) {
                taskCount.statusCounts[oldTask.status]--;
            }

            // Increment the count for the new status
            if (updatedTask.status) {
                taskCount.statusCounts[updatedTask.status]++;
            }

            // Update last updated timestamp
            taskCount.lastUpdated = new Date();

            await taskCount.save();
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
        ).populate('assignee', 'name').populate('leadId', 'name');

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
        const filter = { company: req.user.company._id };

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
            .populate('assignee', 'name')
            .populate('leadId', 'name')
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

// Get task counts with status
exports.getTaskCounts = async (req, res) => {
    try {
        const taskCount = await TaskCount.findOne();

        if (!taskCount) {
            return res.status(404).json({ message: 'Task count information not found' });
        }

        // Get all tasks to properly calculate status counts
        const tasks = await Task.find({ company: req.user.company._id })
            .populate('assignee', 'name')
            .populate('leadId', 'name');

        // Create a map to store assignee status counts
        const assigneeStatusMap = new Map();

        // Group tasks by assignee and status
        tasks.forEach(task => {
            if (task.assignee) {
                const assigneeId = task.assignee._id.toString();
                const status = task.status;

                // Create a unique key combining assignee and status
                const key = `${assigneeId}-${status}`;

                if (!assigneeStatusMap.has(key)) {
                    assigneeStatusMap.set(key, {
                        assignee: task.assignee._id,
                        assigneeName: task.assignee.name,
                        count: 0,
                        status: status
                    });
                }
                const assigneeData = assigneeStatusMap.get(key);
                assigneeData.count++;
            }
        });

        // Convert map to array
        const assigneeStatusCounts = Array.from(assigneeStatusMap.values());

        // Similar process for leads
        const leadStatusMap = new Map();
        tasks.forEach(task => {
            if (task.leadId) {
                const leadId = task.leadId._id.toString();
                const status = task.status;

                // Create a unique key combining lead and status
                const key = `${leadId}-${status}`;

                if (!leadStatusMap.has(key)) {
                    leadStatusMap.set(key, {
                        lead: task.leadId._id,
                        leadName: task.leadId.name,
                        count: 0,
                        status: status
                    });
                }
                const leadData = leadStatusMap.get(key);
                leadData.count++;
            }
        });

        // Convert map to array
        const leadStatusCounts = Array.from(leadStatusMap.values());

        const response = {
            totalTasks: taskCount.totalTasks,
            statusCounts: taskCount.statusCounts,
            priorityCounts: taskCount.priorityCounts,
            assigneeStatusCounts,
            leadStatusCounts,
            lastUpdated: taskCount.lastUpdated
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Add a note to a task
exports.addTaskNote = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Note content is required' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const newNote = {
            content,
            createdBy: req.user._id,
            updatedBy: req.user._id
        };

        task.notes.push(newNote);
        await task.save();

        // Add to activity log
        task.activityLog.push({
            performedBy: req.user._id,
            action: 'note_added',
            referenceData: {
                noteContent: content
            }
        });

        await task.save();

        res.status(201).json({
            message: 'Note added successfully',
            note: newNote
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all notes for a task
exports.getTaskNotes = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId)
            .populate('notes.createdBy', 'name')
            .populate('notes.updatedBy', 'name');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task.notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a note
exports.updateTaskNote = async (req, res) => {
    try {
        const { taskId, noteId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Note content is required' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const noteIndex = task.notes.findIndex(note => note._id.toString() === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Store old content before updating
        const oldContent = task.notes[noteIndex].content;

        // Update note
        task.notes[noteIndex].content = content;
        task.notes[noteIndex].updatedBy = req.user._id;
        task.notes[noteIndex].updatedAt = new Date();

        // Add to activity log
        task.activityLog.push({
            performedBy: req.user._id,
            action: 'note_updated',
            referenceData: {
                noteId: noteId,
                oldContent: oldContent,
                newContent: content
            }
        });

        await task.save();

        res.status(200).json({
            message: 'Note updated successfully',
            note: task.notes[noteIndex]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a note
exports.deleteTaskNote = async (req, res) => {
    try {
        const { taskId, noteId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const noteIndex = task.notes.findIndex(note => note._id.toString() === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: 'Note not found' });
        }

        const deletedNote = task.notes[noteIndex];

        // Remove note from array
        task.notes.splice(noteIndex, 1);

        // Add to activity log
        task.activityLog.push({
            performedBy: req.user._id,
            action: 'note_deleted',
            referenceData: {
                noteId: noteId,
                noteContent: deletedNote.content
            }
        });

        await task.save();

        res.status(200).json({
            message: 'Note deleted successfully',
            deletedNote
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Calculate and store monthly performance metrics
exports.calculateMonthlyPerformance = async (req, res) => {
    try {
        const companyId = req.user.company._id;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // Get all tasks for the current month
        const tasks = await Task.find({
            company: companyId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('assignee', 'name');

        // Preload all pending tasks by assignee in one go
        const pendingTasks = await Task.aggregate([
            {
                $match: {
                    company: companyId,
                    status: 'Pending'
                }
            },
            {
                $group: {
                    _id: '$assignee',
                    count: { $sum: 1 }
                }
            }
        ]);
        const pendingTaskMap = new Map();
        pendingTasks.forEach(item => {
            if (item._id) {
                pendingTaskMap.set(item._id.toString(), item.count);
            }
        });

        // Calculate metrics
        const userMetricsMap = new Map();

        for (const task of tasks) {
            const assignee = task.assignee;
            if (!assignee) continue;

            const userId = assignee._id.toString();
            if (!userMetricsMap.has(userId)) {
                userMetricsMap.set(userId, {
                    userId: assignee._id,
                    userName: assignee.name,
                    completedTasks: 0,
                    createdTasks: 0,
                    pendingTasks: pendingTaskMap.get(userId) || 0,
                    totalCompletionTime: 0,
                    completedOnTime: 0,
                    totalCompleted: 0
                });
            }

            const metrics = userMetricsMap.get(userId);

            // Created tasks
            metrics.createdTasks++;

            if (task.status === 'Completed') {
                metrics.completedTasks++;
                metrics.totalCompleted++;

                const completionTime = task.updatedAt - task.createdAt;
                metrics.totalCompletionTime += completionTime;

                if (task.dueDate && task.updatedAt <= task.dueDate) {
                    metrics.completedOnTime++;
                }
            }
        }

        // Prepare final user metrics
        const userMetrics = Array.from(userMetricsMap.values()).map(metrics => ({
            userId: metrics.userId,
            userName: metrics.userName,
            completedTasks: metrics.completedTasks,
            createdTasks: metrics.createdTasks,
            pendingTasks: metrics.pendingTasks,
            averageCompletionTime: metrics.totalCompleted > 0
                ? metrics.totalCompletionTime / metrics.totalCompleted
                : 0,
            onTimeCompletionRate: metrics.totalCompleted > 0
                ? (metrics.completedOnTime / metrics.totalCompleted) * 100
                : 0
        }));

        // Find or create MonthlyTaskMetrics
        let monthlyMetrics = await MonthlyTaskMetrics.findOne({ company: companyId });
        if (!monthlyMetrics) {
            monthlyMetrics = new MonthlyTaskMetrics({
                company: companyId,
                metrics: []
            });
        }

        // Add the new month’s data
        monthlyMetrics.metrics.push({
            month: currentMonth + 1,
            year: currentYear,
            completedTasks: tasks.filter(task => task.status === 'Completed').length,
            createdTasks: tasks.length,
            totalPendingTasks: pendingTasks.reduce((sum, item) => sum + item.count, 0),
            userMetrics
        });



        return res.status(200).json({
            success: true,
            metrics: monthlyMetrics
        });

    } catch (error) {
        console.error('Error calculating monthly performance:', error);
        return res.status(500).json({
            success: false,
            message: 'Error calculating monthly performance',
            error: error.message
        });
    }
};


// Add this near your other cron jobs
cron.schedule('00 02 28-31 * *', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (tomorrow.getDate() !== 1) return;

    console.log('Running end-of-month task metrics calculation...');

    try {
        const companies = await Company.find();
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        for (const company of companies) {
            const companyId = company._id;

            const tasks = await Task.find({
                company: companyId,
                updatedAt: { $gte: startDate, $lte: endDate }
            }).populate('assignee', 'name');

            const pendingTaskCounts = await Task.aggregate([
                {
                    $match: {
                        company: companyId,
                        status: 'Pending'
                    }
                },
                {
                    $group: {
                        _id: '$assignee',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const pendingMap = new Map();
            for (const p of pendingTaskCounts) {
                if (p._id) pendingMap.set(p._id.toString(), p.count);
            }

            const userMetricsMap = new Map();

            for (const task of tasks) {
                if (!task.assignee) continue;
                const userId = task.assignee._id.toString();

                if (!userMetricsMap.has(userId)) {
                    userMetricsMap.set(userId, {
                        userId: task.assignee._id,
                        userName: task.assignee.name,
                        completedTasks: 0,
                        createdTasks: 0,
                        pendingTasks: pendingMap.get(userId) || 0,
                        totalCompletionTime: 0,
                        completedOnTime: 0,
                        totalCompleted: 0
                    });
                }

                const metrics = userMetricsMap.get(userId);

                if (task.createdAt >= startDate && task.createdAt <= endDate) {
                    metrics.createdTasks++;
                }

                if (task.status === 'Completed') {
                    metrics.completedTasks++;
                    metrics.totalCompleted++;
                    metrics.totalCompletionTime += task.updatedAt - task.createdAt;

                    if (task.dueDate && task.updatedAt <= task.dueDate) {
                        metrics.completedOnTime++;
                    }
                }
            }

            const userMetrics = Array.from(userMetricsMap.values()).map(m => ({
                userId: m.userId,
                userName: m.userName,
                completedTasks: m.completedTasks,
                createdTasks: m.createdTasks,
                pendingTasks: m.pendingTasks,
                averageCompletionTime: m.totalCompleted > 0
                    ? m.totalCompletionTime / m.totalCompleted
                    : 0,
                onTimeCompletionRate: m.totalCompleted > 0
                    ? (m.completedOnTime / m.totalCompleted) * 100
                    : 0
            }));

            const completedTasks = tasks.filter(task => task.status === 'Completed').length;
            const createdTasks = tasks.filter(task =>
                task.createdAt.getMonth() === currentMonth &&
                task.createdAt.getFullYear() === currentYear
            ).length;

            const totalPendingTasks = pendingTaskCounts.reduce((acc, curr) => acc + curr.count, 0);

            await MonthlyTaskMetrics.findOneAndUpdate(
                { company: companyId },
                {
                    $push: {
                        metrics: {
                            month: currentMonth + 1,
                            year: currentYear,
                            completedTasks,
                            createdTasks,
                            totalPendingTasks,
                            userMetrics
                        }
                    },
                    $set: { updatedAt: new Date() }
                },
                { upsert: true, new: true }
            );

            console.log(`Completed metrics for company: ${company.name}`);
        }

        console.log('All company metrics calculated successfully.');

    } catch (error) {
        console.error('Error in monthly metrics cron job:', error);
    }
});
