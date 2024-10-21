const Company = require("../models/Company");
const Invoice = require("../models/invoice");

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    const invoice = new Invoice({
      ...invoiceData,
      company: req.user.company,
    });
    console.log(invoice);
    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ company: req.user.company }).populate(
      "customer"
    );
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.invoiceNumber, // Assuming _id is used as the invoice id
      issuedDate: invoice.dateIssued,
      address: invoice.customer.phone, // Assuming the address is stored in the populated customer object
      company: invoice.customer.name, // Assuming company name is stored directly in the invoice document
      companyEmail: invoice.customer.email, // Assuming company email is also stored in the invoice document
      country: invoice.customer.profile.countryOfInterest, // Assuming customer country is available
      contact: invoice.customer.phone, // Assuming customer phone is available
      name: invoice.customer.name, // Assuming customer name is available
      service: invoice.status, // Assuming service is stored in the invoice
      total: invoice.grandTotal, // Total amount
      avatar: "", // Assuming no avatar data is stored in the database
      avatarColor: "primary", // Defaulting to 'primary' as there is no data about this
      invoiceStatus: invoice.status, // Assuming invoice status is stored as 'status'
      balance: `$123432`, // Balance amount in dollars
      dueDate: invoice.dueDate.getDate,
      refId: invoice._id,
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
      address: invoice.customer.phone, 
      company: invoice.customer.name, 
      companyEmail: invoice.customer.email, 
      country: invoice.customer.profile.countryOfInterest, 
      contact: invoice.customer.phone, 
      name: invoice.customer.name, 
      service: "Some Service", 
      total: invoice.grandTotal, 
      avatar: "", 
      avatarColor: "primary", 
      invoiceStatus: invoice.status, 
      balance: invoice?.grandTotal - invoice?.paid, 
      dueDate: invoice.dueDate,
      items: invoice.items,
      address: invoice.customer.profile.address,
      paid: invoice.paid,
      subtotal: invoice.totalAmount,
      taxRate: invoice.taxRate,
      gst: invoice.gst,
      refId: invoice._id,
      leadId:invoice.customer._id
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
