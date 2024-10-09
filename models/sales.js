const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    SalesId: {
        type: String,
    },
    LeadId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead' // Assuming 'Task' is a model you have defined elsewhere
    }]
});

const Sales = mongoose.model('Stage', salesSchema);

module.exports = Sales;
