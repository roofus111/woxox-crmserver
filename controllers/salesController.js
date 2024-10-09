const Sales = require('../models/sales'); 
const Lead = require('../models/Lead'); 

// Create a new sales entry
exports.createSales = async (req, res) => {
    try {
        const { SalesId, LeadId } = req.body;
        const newSales = new Sales({
            SalesId,
            LeadId
        });

        const savedSales = await newSales.save();
        res.status(201).json(savedSales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating sales entry' });
    }
};

// Get a specific sales entry by ID
exports.getSalesById = async (req, res) => {
    try {
        const sales = await Sales.findById(req.params.id).populate('LeadId');
        if (!sales) {
            return res.status(404).json({ message: 'Sales entry not found' });
        }
        res.status(200).json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sales entry' });
    }
};

// Update a specific sales entry by ID
exports.updateSales = async (req, res) => {
    try {
        const { SalesId, LeadId } = req.body;

        // Check if the Lead IDs exist
        const leads = await Lead.find({ _id: { $in: LeadId } });
        if (leads.length !== LeadId.length) {
            return res.status(400).json({ message: 'One or more Lead IDs are invalid' });
        }

        const updatedSales = await Sales.findByIdAndUpdate(
            req.params.id,
            { SalesId, LeadId },
            { new: true }
        );
        if (!updatedSales) {
            return res.status(404).json({ message: 'Sales entry not found' });
        }
        res.status(200).json(updatedSales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating sales entry' });
    }
};

// Delete a sales entry by ID
exports.deleteSales = async (req, res) => {
    try {
        const deletedSales = await Sales.findByIdAndDelete(req.params.id);
        if (!deletedSales) {
            return res.status(404).json({ message: 'Sales entry not found' });
        }
        res.status(200).json({ message: 'Sales entry deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting sales entry' });
    }
};
