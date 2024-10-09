const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    taskIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task' // Assuming 'Task' is a model you have defined elsewhere
    }]
});

const Stages = mongoose.model('Stage', stageSchema);

module.exports = Stages;
