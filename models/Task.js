const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Makes the title field mandatory
        trim: true      // Trims whitespace from the beginning and end of the title
    }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
