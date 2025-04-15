const mongoose = require('mongoose');

const documentTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "TagManager" }] ,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to update the updatedAt field before saving
documentTemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const DocumentTemplate = mongoose.model('DocumentTemplate', documentTemplateSchema);

module.exports = DocumentTemplate;
