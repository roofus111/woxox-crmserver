const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskCountSchema = new Schema({
    totalTasks: { type: Number, default: 0 },
    statusCounts: {
        Open: { type: Number, default: 0 },
        Cancelled: { type: Number, default: 0 },
        'On Hold': { type: Number, default: 0 },
        Pending: { type: Number, default: 0 },
        Completed: { type: Number, default: 0 }
    },
    priorityCounts: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 }
    },
    assigneeCounts: [{
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
        status: { type: String, enum: ['Open', 'Cancelled', 'On Hold', 'Pending', 'Completed'] }
    }],
    leadCounts: [{
        lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
        count: { type: Number, default: 0 },
         status: { type: String, enum: ['Open', 'Cancelled', 'On Hold', 'Pending', 'Completed'] }
    }],
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Create a compound index to ensure we only have one count document
taskCountSchema.index({}, { unique: true });

module.exports = mongoose.model('TaskCount', taskCountSchema);
