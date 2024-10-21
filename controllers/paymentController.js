const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
// Add a new payment

exports.createPayment = async (req, res) => {
  const session = await mongoose.startSession(); // Start a transaction session
  session.startTransaction();
  try {
    // Generate a unique payment ID
    const paymentId = uuidv4();

    // Merge the generated payment ID with the body data
    const data = {
      ...req.body,
      paymentId,
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

// Get a single payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
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
