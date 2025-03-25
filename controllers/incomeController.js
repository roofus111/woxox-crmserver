const Income = require("../models/Income");
const BankAccount = require("../models/Account");

// Create a new income entry
exports.createIncome = async (req, res) => {
    try {
        // Create the income entry
        const income = new Income({
            ...req.body,
            company: req.user.company._id
        });
        await income.save();

        // Update the account balance
        if (req.body.bankAccountId) {
            const account = await BankAccount.findOne({ 
                _id: req.body.bankAccountId,
                company: req.user.company._id 
            });

            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }

            // Add transaction to account
            await account.addTransaction({
                company: req.user.company._id,
                date: income.date,
                type: 'income',
                amount: income.amount,
                description: income.description,
                category: income.category[0]?.name || 'Uncategorized',
                paymentMethod: income.paymentMethod,
                reference: income._id
            }, req.user._id);
        }

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

// Add category to an income entry
exports.addCategory = async (req, res) => {
    try {
        const { incomeid } = req.params;
        const { name, description } = req.body;

        // Find the income entry
        const income = await Income.findOne({ 
            _id: incomeid, 
            company: req.user.company._id 
        });

        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }

        // Add the new category
        income.category.push({
            name,
            description: description || ''
        });

        await income.save();

        res.status(200).json(income);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get categories for an income entry
exports.getCategories = async (req, res) => {
    try {
        const { incomeid } = req.params;

        // Find the income entry
        const income = await Income.findOne({ 
            _id: incomeid, 
            company: req.user.company._id 
        });

        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }

        // Return the categories array
        res.status(200).json(income.category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get a specific category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const { incomeid, categoryid } = req.params;

        // Find the income entry
        const income = await Income.findOne({ 
            _id: incomeid, 
            company: req.user.company._id 
        });

        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }

        // Find the specific category
        const category = income.category.id(categoryid);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a specific category
exports.updateCategory = async (req, res) => {
    try {
        const { incomeid, categoryid } = req.params;
        const { name, description } = req.body;

        // Find the income entry
        const income = await Income.findOne({ 
            _id: incomeid, 
            company: req.user.company._id 
        });

        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }

        // Find and update the specific category
        const category = income.category.id(categoryid);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Update category fields
        if (name) category.name = name;
        if (description !== undefined) category.description = description;

        await income.save();

        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a specific category
exports.deleteCategory = async (req, res) => {
    try {
        const { incomeid, categoryid } = req.params;

        // Find the income entry
        const income = await Income.findOne({ 
            _id: incomeid, 
            company: req.user.company._id 
        });

        if (!income) {
            return res.status(404).json({ message: "Income entry not found" });
        }

        // Find and remove the specific category
        const category = income.category.id(categoryid);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Use pull() to remove the category by its _id
        income.category.pull(categoryid);
        await income.save();

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
