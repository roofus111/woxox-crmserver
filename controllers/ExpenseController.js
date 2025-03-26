const { Expense } = require("../models/Expense");
const BankAccount = require("../models/Account");

// Create a new expense
exports.createExpense = async (req, res) => {
    try {
        const {
            amount,
            description,
            date,
            paymentMethod,
            receipt,
            project,
            categories,
            recurring,
            recurrenceInterval,
            vat,
            currency,
            isRefunded,
            refundAmount,
            refundReason,
            originalExpense,
            bankAccountId
        } = req.body;

        // Validate required fields
        if (!amount || !bankAccountId) {
            return res.status(400).json({ 
                message: "Amount and bank account ID are required." 
            });
        }

        // Find the bank account
        const bankAccount = await BankAccount.findById(bankAccountId);
        if (!bankAccount) {
            return res.status(404).json({
                message: "Bank account not found."
            });
        }

        // Check if there's sufficient balance
        if (bankAccount.currentBalance < amount) {
            return res.status(400).json({
                message: "Insufficient balance in the bank account."
            });
        }

        // Build the expense object
        const newExpense = new Expense({
            company: req.user.company._id,
            user: req.user._id,
            amount,
            description,
            date: date || Date.now(),
            paymentMethod,
            receipt,
            project: project || null,
            categories: categories || [],
            recurring,
            recurrenceInterval: recurring ? recurrenceInterval : null,
            vat,
            currency,
            isRefunded,
            refundAmount: isRefunded ? refundAmount : 0,
            refundReason: isRefunded ? refundReason : '',
            refundDate: isRefunded ? Date.now() : null,
            originalExpense: originalExpense || null,
            bankAccountId
        });

        try {
            // Create the expense
            await newExpense.save();
            
            // Add transaction to bank account
            await bankAccount.addTransaction({
                company: req.user.company._id,
                date: date || Date.now(),
                type: 'expense',
                amount: amount,
                description: description,
                category: categories?.[0]?.name || 'Uncategorized',
                paymentMethod: paymentMethod,
                reference: newExpense._id
            }, req.user._id);

            res.status(201).json({
                message: "Expense created successfully!",
                expense: newExpense,
            });
        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

// Example: Modify error handling
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({company:req.user.company._id});
        res.status(200).json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error); // Log error details
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


//Get a single expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update an expense
exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json(expense);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add category to an expense
exports.addCategory = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { name, description } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        // Check if category already exists
        const categoryExists = expense.category.some(cat => cat.name.toLowerCase() === name.toLowerCase());
        if (categoryExists) {
            return res.status(400).json({
                message: "Category already exists for this expense."
            });
        }

        // Add new category
        expense.category.push({
            name,
            description: description || ''
        });

        // Save the updated expense
        await expense.save();

        res.status(200).json({
            message: "Category added successfully!",
            expense
        });

    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get categories for an expense
exports.getCategories = async (req, res) => {
    try {
        const { expenseId } = req.params;

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.status(200).json({
            message: "Categories retrieved successfully!",
            categories: expense.category
        });

    } catch (error) {
        console.error("Error getting categories:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get a specific category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const { expenseId, categoryId } = req.params;

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        // Find the category
        const category = expense.category.id(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        res.status(200).json({
            message: "Category retrieved successfully!",
            category
        });

    } catch (error) {
        console.error("Error getting category:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const { expenseId, categoryId } = req.params;
        const { name, description } = req.body;

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        // Find the category
        const category = expense.category.id(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        // Check if new name already exists (excluding current category)
        if (name && name !== category.name) {
            const categoryExists = expense.category.some(cat => 
                cat._id.toString() !== categoryId && 
                cat.name.toLowerCase() === name.toLowerCase()
            );
            if (categoryExists) {
                return res.status(400).json({
                    message: "Category name already exists."
                });
            }
        }

        // Update category fields
        if (name) category.name = name;
        if (description !== undefined) category.description = description;

        // Save the updated expense
        await expense.save();

        res.status(200).json({
            message: "Category updated successfully!",
            category
        });

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const { expenseId, categoryId } = req.params;

        // Find the expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        // Find the category
        const category = expense.category.id(categoryId);
        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        // Remove the category using pull
        expense.category.pull(categoryId);
        await expense.save();

        res.status(200).json({
            message: "Category deleted successfully!"
        });

    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
