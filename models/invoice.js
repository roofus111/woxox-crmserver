const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  dateIssued: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead", // Assuming you have a Customer model
    required: true,
  },
  items: [
    {
      item: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      cost: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  
totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 18,
  },
  gst: {
    type: Number,
    required: true,
    min: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Overdue", "Cancelled","Refunded"],
    default: "Pending",
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paid:{
    type:Number,
    default:0
  },
  sales:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sales", // This references the Invoice model
  }
});


module.exports = mongoose.model("Invoice", InvoiceSchema);
