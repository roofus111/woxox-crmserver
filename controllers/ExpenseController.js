const { Expense } = require("../models/Expense");

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
            categories,
            recurring,
            recurrenceInterval,
            vat,
            currency,
            isRefunded,
            refundAmount,
            refundReason,
            originalExpense
        } = req.body;

        // Validate required fields
        if (!company || !user || !amount) {
            return res.status(400).json({ message: "Company, user, and amount are required." });
        }

        // Ensure refund amount does not exceed original amount
        if (isRefunded && refundAmount > amount) {
            return res.status(400).json({ message: "Refund amount cannot exceed the original expense amount." });
        }

        // Build the expense object
        const newExpense = new Expense({
            company,
            user,
            amount,
            description,
            date: date || Date.now(),
            paymentMethod,
            receipt,
            project: project || null,
            categories: categories || [], // Embedded category array
            recurring,
            recurrenceInterval: recurring ? recurrenceInterval : null, // Ensure interval is set only if recurring
            vat,
            currency,
            isRefunded,
            refundAmount: isRefunded ? refundAmount : 0,
            refundReason: isRefunded ? refundReason : '',
            refundDate: isRefunded ? Date.now() : null,
            originalExpense: originalExpense || null
        });

        // Save expense to database
        await newExpense.save();
        
        res.status(201).json({
            message: "Expense created successfully!",
            expense: newExpense
        });

    } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
