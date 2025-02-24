const { Expense } = require('../models/Expense'); // Import Expense model
const { Category } = require('../models/Expense'); // Import Category model

// Create a new expense
exports.createExpense = async (req, res) => {
    try {
        const {
            company,
            user,
            amount,
            description,
            date,
            paymentMethod,
            receipt,
            project,
            categories, // Array of category objects (embedded)
            recurring,
            recurrenceInterval,
            vat,
            currency,
            isRefunded,
            refundAmount,
            refundDate,
            refundReason,
            originalExpense
        } = req.body;

        // Create the new expense with embedded categories
        const newExpense = new Expense({
            company,
            user,
            amount,
            description,
            date,
            paymentMethod,
            receipt,
            project,
            categories, // Directly storing category objects inside the expense
            recurring,
            recurrenceInterval,
            vat,
            currency,
            isRefunded,
            refundAmount,
            refundDate,
            refundReason,
            originalExpense
        });

        // Save the expense to the database
        const savedExpense = await newExpense.save();
        res.status(201).json({ success: true, data: savedExpense });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}; 

// Add a new category to an existing expense
exports.addCategoryToExpense = async (req, res) => {
    try {
        const { expenseId } = req.params; // Get expense ID from request params
        const { name, description } = req.body; // Get category details from request body

        // Validate inputs
        if (!name) {
            return res.status(400).json({ message: "Category name is required." });
        }

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found." });
        }

        // Check if category already exists in the expense
        const categoryExists = expense.categories.some(category => category.name.toLowerCase() === name.toLowerCase());
        if (categoryExists) {
            return res.status(400).json({ message: "Category already exists in this expense." });
        }

        // Add new category to the expense
        expense.categories.push({ name, description });

        // Save updated expense
        await expense.save();

        res.status(200).json({ message: "Category added successfully.", expense });

    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

exports.getCategoriesByExpense = async (req, res) => {
    try {
        const { expenseId } = req.params; // Get expense ID from request params

        // Find the expense and return only categories
        const expense = await Expense.findById(expenseId).select('categories');
        if (!expense) {
            return res.status(404).json({ message: "Expense not found." });
        }

        res.status(200).json({ categories: expense.categories });

    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};
exports.updateCategoryInExpense = async (req, res) => {
    try {
        const { expenseId, categoryId } = req.params; // Get expense and category IDs from params
        const { name, description } = req.body; // Get updated category data

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found." });
        }

        // Find the category within the expense
        const category = expense.categories.id(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        // Update the category fields
        if (name) category.name = name;
        if (description) category.description = description;

        // Save the updated expense
        await expense.save();

        res.status(200).json({ message: "Category updated successfully.", category });

    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};
exports.deleteCategoryFromExpense = async (req, res) => {
    try {
        const { expenseId, categoryId } = req.params; // Get expense and category IDs from params

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found." });
        }

        // Find the category index in the array
        const categoryIndex = expense.categories.findIndex(category => category._id.toString() === categoryId);
        if (categoryIndex === -1) {
            return res.status(404).json({ message: "Category not found in this expense." });
        }

        // Remove the category
        expense.categories.splice(categoryIndex, 1);

        // Save the updated expense
        await expense.save();

        res.status(200).json({ message: "Category deleted successfully.", expense });

    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};







