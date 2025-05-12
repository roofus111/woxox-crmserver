const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const mongoose = require("mongoose");
const BankAccount = require("../models/Account");
const Income = require("../models/Income");
// Add a new payment


const getTotalCount = async (companyId) => {
  try {
    const filter = companyId ? { company: companyId } : {}; // Create a filter based on companyId if provided
    const count = await Payment.countDocuments(filter); // Count documents in the Invoice collection
    return count;
  } catch (error) {
    console.error("Error getting invoice count:", error); 
    throw new Error("Unable to retrieve invoice count.");
  }
};
exports.createPayment = async (req, res) => {
  const session = await mongoose.startSession(); // Start a transaction session
  session.startTransaction();
  try {
    // Generate a unique payment ID
    const count = await getTotalCount(req.user.company);

    // Merge the generated payment ID with the body data
    const data = {
      ...req.body,
      paymentId: (count + 1).toString().padStart(5, '0'),
      userId: req.user._id,
      company: req.user.company._id,
    };
    const payment = new Payment(data);

    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.body.invoice,
      { $inc: { paid: payment.amount } },
      { new: true, session }
    );

    if (!updatedInvoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update bank account balance
    if (req.body.bankAccountId) {
      const bankAccount = await BankAccount.findById(req.body.bankAccountId);
      if (!bankAccount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Bank account not found" });
      }

      // Create transaction record
      const transactionData = {
        company: req.user.company._id,
        date: new Date(),
        type: 'income',
        amount: payment.amount,
        description: `Payment for invoice ${payment.paymentId}`,
        category: 'Invoice Payment',
        paymentMethod: payment.paymentMethod || 'Bank Transfer',
        reference: payment.paymentId
      };

      // Add transaction to bank account
      await bankAccount.addTransaction(transactionData, req.user._id);
    }

    await payment.save({ session });
    
    // Create an Income record
    const incomeData = {
      company: req.user.company._id,
      amount: payment.amount,
      description: `Income from payment ${payment.paymentId}`,
      date: new Date(),
      bankAccountId: req.body.bankAccountId,
      paymentMethod: payment.paymentMethod || 'Bank Transfer',
      currency: 'USD', // or any other currency you want to set
      isRecurring: false, // set this based on your logic
      category: req.body.category // assuming you have a category in the request body
    };
    
    const income = new Income(incomeData);
    await income.save({ session }); // Save the income record within the transaction

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(payment);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(400)
      .json({ message: "Failed to create payment", error: error.message });
  }
};

// Retrieve all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ company: req.user.company })
      .populate("leadId")
      .populate("invoice")
      .populate("company");
    res.status(200).send(payments);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getPaymentsByLeads = async (req, res) => {
  try {
    const payments = await Payment.find({ company: req.user.company,leadId:req.params.leadId }).populate(
      "leadId"
    ).populate("invoice");
    res.status(200).send(payments);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get a single payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "leadId"
    ).populate("invoice");
    if (!payment) {
      return res.status(404).send();
    }
    res.status(200).send(payment);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a payment by ID
exports.updatePayment = async (req, res) => {
  try {
    // First get the original payment with company check
    const originalPayment = await Payment.findOne({
      _id: req.params.id,
      company: req.user.company._id  // Ensure we're finding payment for the correct company
    });

    if (!originalPayment) {
      console.log('Payment not found:', req.params.id);
      return res.status(404).send({ error: 'Payment not found' });
    }

    // Find the bank account
    const bankAccount = await BankAccount.findOne({
      _id: originalPayment.bankAccountId,
      company: req.user.company._id
    });

    if (!bankAccount) {
      console.log('Bank account not found:', originalPayment.bankAccountId);
      return res.status(404).send({ error: 'Bank account not found' });
    }

    // Calculate amount difference
    const oldAmount = originalPayment.amount;
    const newAmount = req.body.amount || oldAmount;
    const amountDifference = newAmount - oldAmount;

    // Create a reversal transaction if amount changed
    if (amountDifference !== 0) {
      // First reverse the old transaction
      await bankAccount.addTransaction({
        company: originalPayment.company,
        date: Date.now(),
        type: 'expense', // Reverse the original income
        amount: oldAmount,
        description: `Reversal for payment ${originalPayment.paymentId}`,
        category: 'Payment Reversal',
        paymentMethod: originalPayment.paymentMethod,
        reference: `reversal_${originalPayment.paymentId}`
      }, req.user._id);

      // Add new transaction with updated amount
      await bankAccount.addTransaction({
        company: originalPayment.company,
        date: req.body.transactionDate || Date.now(),
        type: 'income',
        amount: newAmount,
        description: req.body.description || originalPayment.description,
        category: 'Payment',
        paymentMethod: req.body.paymentMethod || originalPayment.paymentMethod,
        reference: originalPayment.paymentId
      }, req.user._id);
    }

    // Update the payment document
    const updatedPayment = await Payment.findOneAndUpdate(
      { 
        _id: req.params.id,
        company: req.user.company._id
      },
      {
        ...req.body,
        amount: newAmount,
        updatedAt: Date.now()
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedPayment) {
      throw new Error('Failed to update payment');
    }

    await bankAccount.save();

    res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete a payment by ID
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).send();
    }
    res.status(200).send(payment);
  } catch (error) {
    res.status(500).send(error);
  }
};
