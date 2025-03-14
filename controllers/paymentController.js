const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const mongoose = require("mongoose");
const BankAccount = require("../models/Account");
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
      req.body.invoice, // Ensure the field is named correctly
      { $inc: { paid: payment.amount } }, // Increment the 'paid' field by the payment amount
      { new: true, session } // Use the transaction session
    );

    if (!updatedInvoice) {
      await session.abortTransaction(); // Abort transaction if the invoice update fails
      session.endSession();
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Find and update the bank account
    const bankAccount = await BankAccount.findOne({ 
      company: req.user.company._id,
      _id: req.body.bankAccountId 
    }).session(session);

    if (!bankAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Bank account not found" });
    }

    // Add transaction to bank account
    await bankAccount.addTransaction({
      company: req.user.company._id,
      date: new Date(),
      type: 'income',
      amount: payment.amount,
      description: `Payment received for invoice ${updatedInvoice.invoiceId}`,
      category: 'payment',
      paymentMethod: payment.paymentMethod,
      reference: payment.paymentId
    }, req.user._id);

    await payment.save({ session }); // Save the payment within the transaction
    await session.commitTransaction(); // Commit the transaction
    session.endSession();

    res.status(201).json(payment); // Send back the newly created payment record
  } catch (error) {
    await session.abortTransaction(); // Ensure transaction is aborted on error
    session.endSession();
    res
      .status(400)
      .json({ message: "Failed to create payment", error: error.message });
  }
};

// Retrieve all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ company: req.user.company }).populate(
      "leadId"
    ).populate("invoice");
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
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!payment) {
      return res.status(404).send();
    }
    res.status(200).send(payment);
  } catch (error) {
    res.status(400).send(error);
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
