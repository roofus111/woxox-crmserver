const TaskCalender = require("../model/taskCalender");

// Create a new task
exports.createTask = async (req, res) => {
    try {

        const { taskTitle, description, status, priority, dueDate, assignees } = req.body;

        // Basic validation
        if (!taskTitle) {
            return res.status(400).json({ success: false, message: "Task Title is required" });
        }

        // Create new task
        const task = new TaskCalender({
            company: req.user.company._id,
            user: req.user._id,
            taskTitle,
            description,
            status,
            priority,
            dueDate,
            assignees
        });

        await task.save();
        res.status(201).json({ success: true, data: task });

    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Get all tasks for the authenticated user's company
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await TaskCalender.find({ company: req.user.company._id })
            .populate("user", "name email") // Populate user details
            .populate("assignees", "name email") // Populate assignee details
            .sort({ dueDate: 1 }); // Sort by due date

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await TaskCalender.findOne({ _id: req.params.id, company: req.user.company._id })
            .populate("user", "name email")
            .populate("assignees", "name email");

        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const { taskTitle, description, status, priority, dueDate, assignees } = req.body;

        // Find the task and ensure it belongs to the user's company
        let task = await TaskCalender.findOne({ _id: req.params.id, company: req.user.company._id });

        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        // Update fields
        task.taskTitle = taskTitle || task.taskTitle;
        task.description = description || task.description;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.dueDate = dueDate || task.dueDate;
        task.assignees = assignees || task.assignees;

        await task.save();
        res.status(200).json({ success: true, data: task });

    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        // Find the task and ensure it belongs to the user's company
        const task = await TaskCalender.findOne({ _id: req.params.id, company: req.user.company._id });

        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        await task.deleteOne();
        res.status(200).json({ success: true, message: "Task deleted successfully" });

    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};
