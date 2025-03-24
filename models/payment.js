const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
      },
    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ['Cash', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transactionDate: {
      type: Date,
      required: true
    },
    paymentGateway: {
      type: String,
      enum: ["PayPal", "Stripe", "Razorpay", "other"],
    },
    description: {
      type: String,
    },
    refundId: {
      type: String, // Reference to a refund if applicable
    },
    // bankAccountId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'BankAccount',
    //   required: true
    // }
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
