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
            category,
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
            category: category || null,
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

        // Calculate total amount including VAT
        const totalAmount = amount + (amount * (vat || 0) / 100);

        // Check if there's sufficient balance with total amount including VAT
        if (bankAccount.currentBalance < totalAmount) {
            return res.status(400).json({
                message: "Insufficient balance in the bank account (including VAT)."
            });
        }

        try {
            // Create the expense
            await newExpense.save();
            
            // Add transaction to bank account with total amount
            await bankAccount.addTransaction({
                company: req.user.company._id,
                date: date || Date.now(),
                type: 'expense',
                amount: totalAmount,
                description: description,
                category: 'Uncategorized',
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
        const { month, year } = req.query;
        let query = { company: req.user.company._id };

        // Add date filtering if month and year are provided
        if (month && year) {
            const startDate = new Date(year, month - 1, 1); // Month is 0-based in JS Date
            const endDate = new Date(year, month, 0); // Last day of the month
            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const expenses = await Expense.find(query)
            .populate('category', 'name');
        res.status(200).json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


//Get a single expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('category', 'name');
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
        // Find the original expense first
        const originalExpense = await Expense.findById(req.params.id);
        if (!originalExpense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Find the associated bank account
        const bankAccount = await BankAccount.findById(originalExpense.bankAccountId);
        if (!bankAccount) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        // Calculate old and new total amounts (including VAT)
        const oldTotalAmount = originalExpense.amount + (originalExpense.amount * (originalExpense.vat || 0) / 100);
        const newAmount = req.body.amount || originalExpense.amount;
        const newVat = req.body.vat !== undefined ? req.body.vat : originalExpense.vat;
        const newTotalAmount = newAmount + (newAmount * (newVat || 0) / 100);

        // Check if there's sufficient balance for the new amount
        const balanceAfterReversal = bankAccount.currentBalance + oldTotalAmount;
        if (balanceAfterReversal < newTotalAmount) {
            return res.status(400).json({
                message: "Insufficient balance in the bank account (including VAT)."
            });
        }

        // First, reverse the old transaction
        await bankAccount.addTransaction({
            company: originalExpense.company,
            date: Date.now(),
            type: 'expense',
            amount: -oldTotalAmount, // Negative amount to reverse the original transaction
            description: `Reversal: ${originalExpense.description}`,
            category: 'Uncategorized',
            paymentMethod: originalExpense.paymentMethod,
            reference: originalExpense._id
        }, originalExpense.user);

        // Update the expense
        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Create a new transaction with the updated amount
        await bankAccount.addTransaction({
            company: updatedExpense.company,
            date: req.body.date || originalExpense.date,
            type: 'expense',
            amount: newTotalAmount,
            description: req.body.description || originalExpense.description,
            category: 'Uncategorized',
            paymentMethod: req.body.paymentMethod || originalExpense.paymentMethod,
            reference: updatedExpense._id
        }, originalExpense.user);

        res.status(200).json(updatedExpense);
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// exports.deleteExpense = async (req, res) => {
//     try {
//         const expense = await Expense.findByIdAndDelete(req.params.id);
//         if (!expense) {
//             return res.status(404).json({ message: 'Expense not found' });
//         }
//         res.status(200).json({ message: 'Expense deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

