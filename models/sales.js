const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    SalesId: {
        type: String,
        required: true // Ensure that every sales record has a Sales ID
    },
    LeadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead', // Make sure 'Lead' is correctly defined and used elsewhere in your app
        required: true // If a sale must be linked to a lead, mark this as required
    },
    company: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true // Ensures all sales are linked to a company
    },
    createdAt: { 
        type: Date, 
        default: Date.now // Automatically set to the current date/time when a new document is created
    },
});

const Sales = mongoose.model('Sales', salesSchema);

module.exports = Sales;
