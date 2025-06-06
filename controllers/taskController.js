const Task = require('../models/Task');

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

