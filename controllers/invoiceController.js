const Company = require("../models/Company");
const Invoice = require("../models/invoice");

const getTotalInvoiceCount = async (companyId) => {
  try {
    const filter = companyId ? { company: companyId } : {}; // Create a filter based on companyId if provided
    const count = await Invoice.countDocuments(filter); // Count documents in the Invoice collection
    return count;
  } catch (error) {
    console.error("Error getting invoice count:", error);
    throw new Error("Unable to retrieve invoice count.");
  }
};

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    const count = await getTotalInvoiceCount(req.user.company); 

    const invoice = new Invoice({
      ...invoiceData,
      invoiceNumber : (count + 1).toString().padStart(5, '0'),
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
      id: invoice.invoiceNumber,
      issuedDate: invoice.dateIssued,
      address: invoice.customer?.phone, 
      company: invoice.customer?.name, 
      companyEmail: invoice.customer?.email, 
      country: invoice.customer?.profile.countryOfInterest, 
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
      leadId:invoice.customer?._id,
      _id:invoice._id
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
    const invoice = await Invoice.findById(req.params.id).populate("customer?");
    console.log(invoice);

    const formattedInvoices = {
      id: invoice.invoiceNumber,
      issuedDate: invoice.dateIssued,
      address: invoice.customer?.phone, 
      company: invoice.customer?.name, 
      companyEmail: invoice.customer?.email, 
      country: invoice.customer?.profile.countryOfInterest, 
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
      country: invoice.customer?.profile.countryOfInterest, 
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