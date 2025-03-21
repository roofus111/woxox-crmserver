const { Expense } = require("../models/Expense");
// const BankAccount = require("../models/Account");

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
        } = req.body;

        // Validate required fields
        if (!amount) { // Removed bankAccountId check
            return res.status(400).json({ 
                message: "Amount is required." 
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
            originalExpense: originalExpense || null
        });

       
        try {
            await newExpense.save();
            
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
