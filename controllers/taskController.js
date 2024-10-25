const Task = require('../models/Task');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const task = new Task({
            text: req.body.text,
            userId :req.user._id
        });
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Retrieve all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find({userId:req.user._id});
        res.send(tasks);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
};
