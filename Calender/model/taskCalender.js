const mongoose = require('mongoose');

const TaskCalenderSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Sales representative
        required: true,
    },
    taskTitle: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['todo', 'in progress', 'completed'],
        default: 'todo',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    dueDate: {
        type: Date,
    },
    assignees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
});

const TaskCalender = mongoose.model('TaskCalender', TaskCalenderSchema);

module.exports = TaskCalender;
