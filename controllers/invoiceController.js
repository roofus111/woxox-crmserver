const Company = require("../models/Company");
const Invoice = require("../models/invoice");
const Sales = require("../models/sales");
const Payment = require("../models/Payment");
const mongoose = require('mongoose');

const getTotalInvoiceCount = async (companyId) => {
  try {
    const filter = companyId ? { company: companyId } : {};
    // Find the invoice with the highest invoice number
    const lastInvoice = await Invoice.findOne(filter)
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber');
    
    if (!lastInvoice) return 0;
    
    // Convert the last invoice number to integer
    return parseInt(lastInvoice.invoiceNumber, 10);
  } catch (error) {
    console.error("Error getting invoice count:", error);
    throw new Error("Unable to retrieve invoice count.");
  }
};
// Create a new invoice
exports.createInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoiceData = req.body;

    // Get invoice count
    const count = await getTotalInvoiceCount(req.user.company);

    const invoice = new Invoice({
      ...invoiceData,
      invoiceNumber: (count + 1).toString().padStart(5, '0'),
      company: req.user.company,
    });       

    console.log(invoice);
    // Save invoice
    const savedInvoice = await invoice.save({ session });
    console.log(savedInvoice._id);

    // If sales ID is provided, update the sales record
    if (invoiceData.sales) {
      const sales = await Sales.findById(invoiceData.sales).session(session);
      if (sales) {
        sales.invoice.push(savedInvoice._id);
        await sales.save({ session });
      }
    }

    await session.commitTransaction();
    res.status(201).json(savedInvoice);
 
  } catch (error) {
    await session.abortTransaction();
    
    const statusCode = error.message.includes('required') ? 400 : 
                      error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    session.endSession();
  }
};
// // Create a new invoice
// exports.createInvoice = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const invoiceData = req.body;

//     // Validate required fields
//     if (!invoiceData.sales) {
//       throw new Error('Sales ID is required');
//     }

//     // Get invoice count and validate sales existence concurrently
//     const [count, sales] = await Promise.all([
//       getTotalInvoiceCount(req.user.company),
//       Sales.findById(invoiceData.sales).session(session)
//     ]);

//     if (!sales) {
//       throw new Error('Sales record not found');
//     }

//     const invoice = new Invoice({
//       ...invoiceData,
//       invoiceNumber: (count + 1).toString().padStart(5, '0'),
//       company: req.user.company,
//     });
// console.log(invoice);
//     // Save invoice first to get a valid _id
//     const savedInvoice = await invoice.save({ session });
//     console.log(savedInvoice._id);
//     // Now update sales with the saved invoice's _id
//     sales.invoice.push(savedInvoice._id);
//     await sales.save({ session });

//     await session.commitTransaction();
//     res.status(201).json(savedInvoice);
 
//   } catch (error) {
//     await session.abortTransaction();
    
//     const statusCode = error.message.includes('required') ? 400 : 
//                       error.message.includes('not found') ? 404 : 500;
    
//     res.status(statusCode).json({ 
//       message: error.message,
//       error: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   } finally {
//     session.endSession();
//   }
// };

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ company: req.user.company }).populate(
      "customer"
    );
const formattedInvoices = invoices.map((invoice) => ({
  id: invoice.invoiceNumber,
  issuedDate: invoice.dateIssued,
  address: invoice.customer?.profile?.address, // Ensure safe access
  company: invoice.customer?.name,
  companyEmail: invoice.customer?.email,
  country: invoice.customer?.profile?.countryOfInterest, // Fix here
  contact: invoice.customer?.phone,
  name: invoice.customer?.name,
  service: "Some Service",
  total: invoice.grandTotal,
  avatar: "",
  avatarColor: "primary",
  invoiceStatus: invoice.status,
  balance: invoice?.grandTotal - invoice?.paid,
  dueDate: invoice.dueDate,
  items: invoice.items,
  paid: invoice.paid,
  subtotal: invoice.totalAmount,
  taxRate: invoice.taxRate,
  gst: invoice.gst,
  refId: invoice._id,
  leadId: invoice.customer?._id,
  salesId: invoice.sales,
  _id: invoice._id
    }));

    res.status(200).json(formattedInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific invoice by ID
exports.getInvoiceById = async (req, res) => {
  console.log("api triggered");

  try {
    const invoice = await Invoice.findById(req.params.id).populate("customer");
    console.log(invoice);

    const formattedInvoices = {
      id: invoice.invoiceNumber,
      issuedDate: invoice.dateIssued,
      address: invoice.customer?.phone, 
      company: invoice.customer?.name, 
      companyEmail: invoice.customer?.email, 
      country: invoice.customer?.profile?.countryOfInterest, 
      contact: invoice.customer?.phone, 
      name: invoice.customer?.name, 
      service: "Some Service", 
      total: invoice.grandTotal, 
      avatar: "", 
      avatarColor: "primary", 
      invoiceStatus: invoice.status, 
      balance: invoice?.grandTotal - invoice?.paid, 
      dueDate: invoice.dueDate,
      items: invoice.items,
      address: invoice.customer?.profile?.address,
      paid: invoice.paid,
      subtotal: invoice.totalAmount,
      taxRate: invoice.taxRate,
      gst: invoice.gst,
      refId: invoice._id,
      leadId:invoice.customer?._id
    };

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(formattedInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an invoice
exports.updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getInvoicesByLeads = async (req, res) => {
  try {
    const invoices = await Invoice.find({ company: req.user.company,customer :req.params.leadId }).populate(
      "customer"
    );
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.invoiceNumber,
      issuedDate: invoice.dateIssued,
      address: invoice.customer?.phone, 
      company: invoice.customer?.name, 
      companyEmail: invoice.customer?.email, 
      contact: invoice.customer?.phone, 
      name: invoice.customer?.name, 
      service: "Some Service", 
      total: invoice.grandTotal, 
      avatar: "", 
      avatarColor: "primary", 
      invoiceStatus: invoice.status, 
      balance: invoice?.grandTotal - invoice?.paid, 
      dueDate: invoice.dueDate,
      items: invoice.items,
      address: invoice.customer?.profile.address,
      paid: invoice.paid,
      subtotal: invoice.totalAmount,
      taxRate: invoice.taxRate,
      gst: invoice.gst,
      refId: invoice._id,
      leadId:invoice.customer?._id
    }));

    res.status(200).json(formattedInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment history by invoice ID
exports.getPaymentHistoryByInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // // Validate invoice ID
    // if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
    //   return res.status(400).json({ message: "Invalid invoice ID" });
    // }

    // Check if invoice exists and belongs to the user's company
    const invoice = await Invoice.findOne({ 
      _id: invoiceId, 
      company: req.user.company 
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Find all payments for this invoice
    const payments = await Payment.find({ 
      invoice: invoiceId,
      company: req.user.company 
    }).populate([
      {
        path: 'bankAccountId',
        select: 'accountNumber accountHolderName bankName'
      },
      {
        path: 'userId',
        select: 'firstName lastName email'
      }
    ]).sort({ transactionDate: -1 });

    // Format the response
    const paymentHistory = payments.map(payment => ({
      paymentId: payment.paymentId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionDate: payment.transactionDate,
      paymentGateway: payment.paymentGateway,
      description: payment.description,
      refundId: payment.refundId,
      bankAccount: payment.bankAccountId ? {
        accountNumber: payment.bankAccountId.accountNumber,
        accountHolderName: payment.bankAccountId.accountHolderName,
        bankName: payment.bankAccountId.bankName
      } : null,
      processedBy: payment.userId ? {
        name: `${payment.userId.firstName} ${payment.userId.lastName}`,
        email: payment.userId.email
      } : null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));

    res.status(200).json({
      invoiceId: invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.grandTotal,
      paidAmount: invoice.paid || 0,
      balanceAmount: (invoice.grandTotal || 0) - (invoice.paid || 0),
      paymentCount: payments.length,
      paymentHistory: paymentHistory
    });

  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ 
      message: "Error fetching payment history",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};