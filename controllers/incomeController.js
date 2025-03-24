const Income = require("../models/Income");
// Create a new income entry
exports.createIncome = async (req, res) => {
    try {
        const income = new Income({
            ...req.body,
            company: req.user.company._id
        });
        await income.save();
        res.status(201).json(income);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Get all income entries for the user's company
exports.getIncome = async (req, res) => {
    try {
        const incomes = await Income.find({ company: req.user.company._id });
        res.status(200).json(incomes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Get an income entry by ID
exports.getIncomeById = async (req, res) => {
    try {
        const income = await Income.findOne({ _id: req.params.id, company: req.user.company._id });
        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }
        res.status(200).json(income);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateIncome = async (req, res) => {
    try {
        const income = await Income.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }
        res.status(200).json(income);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an income entry by ID
exports.deleteIncome = async (req, res) => {
    try {
        const income = await Income.findOneAndDelete({ _id: req.params.id, company: req.user.company._id });
        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};