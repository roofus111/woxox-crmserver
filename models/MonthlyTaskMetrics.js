const mongoose = require('mongoose');

const userMetricsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: String,
    completedTasks: {
        type: Number,
        default: 0
    },
    createdTasks: {
        type: Number,
        default: 0
    },
    pendingTasks: {
        type: Number,
        default: 0
    },
    averageCompletionTime: {
        type: Number,
        default: 0
    },
    onTimeCompletionRate: {
        type: Number,
        default: 0
    }
});

const monthlyTaskMetricsSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    metrics: [{
        month: {
            type: Number,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        completedTasks: {
            type: Number,
            default: 0
        },
        createdTasks: {
            type: Number,
            default: 0
        },
        totalPendingTasks: {
            type: Number,
            default: 0
        },
        userMetrics: [userMetricsSchema]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique metrics per company per month
monthlyTaskMetricsSchema.index({ company: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyTaskMetrics', monthlyTaskMetricsSchema);