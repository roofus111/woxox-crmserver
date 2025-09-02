const Sales = require('../models/sales');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const ProductService = require('../models/productService');

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    const {
      leadId,
      customerId,
      invoices,
      notes,
      status,
      accepted,
      totalAmountPaid,
      currency
    } = req.body;

    // Validate required fields
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required'
      });
    }

    // Validate lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Validate customer exists (if provided)
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    // Validate invoices exist (if provided)
    if (invoices && invoices.length > 0) {
      const Invoice = require('../models/invoice');
      const existingInvoices = await Invoice.find({
        _id: { $in: invoices }
      });
      
      if (existingInvoices.length !== invoices.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invoices not found'
        });
      }
    }

    // Create new sale according to schema
    const newSale = new Sales({
      leadId,
      Customer: customerId || null,
      invoices: invoices || [],
      notes: notes || '',
      status: status || 'pending',
      accepted: accepted || false,
      totalAmountPaid: totalAmountPaid || 0,
      currency: currency || 'USD',
      company: req.user.company._id,
      createdBy: req.user._id
    });

    const savedSale = await newSale.save();

    // Populate references for response
    await savedSale.populate([
      { path: 'leadId', select: 'name email phone' },
      { path: 'Customer', select: 'name email phone' },
      { path: 'invoices', select: 'invoiceNumber amount status' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      sale: savedSale
    });

  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all sales for the company
exports.getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = { company: req.user.company._id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { salesId: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const sales = await Sales.find(query)
      .populate('leadId', 'name email phone')  
      .populate('Customer', 'name email phone')
      .populate('invoices', 'invoiceNumber amount status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sales.countDocuments(query);

    res.status(200).json({
      success: true,
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findOne({
      _id: id,
      company: req.user.company._id
    })
    .populate('leadId', 'name email phone')
    .populate('Customer', 'name email phone')
    .populate('invoices', 'invoiceNumber amount status')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      sale
    });

  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
      invoices,
      notes,
      status,
      accepted,
      totalAmountPaid,
      currency
    } = req.body;

    const sale = await Sales.findOne({
      _id: id,
      company: req.user.company._id
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Validate customer exists (if provided)
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    // Validate invoices exist (if provided)
    if (invoices && invoices.length > 0) {
      const Invoice = require('../models/invoice');
      const existingInvoices = await Invoice.find({
        _id: { $in: invoices }
      });
      
      if (existingInvoices.length !== invoices.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invoices not found'
        });
      }
    }

    // Update fields according to schema
    if (customerId !== undefined) sale.Customer = customerId;
    if (invoices !== undefined) sale.invoices = invoices;
    if (notes !== undefined) sale.notes = notes;
    if (status !== undefined) sale.status = status;
    if (accepted !== undefined) sale.accepted = accepted;
    if (totalAmountPaid !== undefined) sale.totalAmountPaid = totalAmountPaid;
    if (currency !== undefined) sale.currency = currency;
    
    sale.updatedBy = req.user._id;

    const updatedSale = await sale.save();

    // Populate references for response
    await updatedSale.populate([
      { path: 'leadId', select: 'name email phone' },
      { path: 'Customer', select: 'name email phone' },
      { path: 'invoices', select: 'invoiceNumber amount status' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      sale: updatedSale
    });

  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findOne({
      _id: id,
      company: req.user.company._id
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    await Sales.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
        break;
      case 'year':
        dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } };
        break;
      default:
        dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    }

    const query = { 
      company: req.user.company._id,
      ...dateFilter
    };

    const [
      totalSales,
      totalAmount,
      statusCounts,
      recentSales
    ] = await Promise.all([
      Sales.countDocuments(query),
      Sales.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Sales.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Sales.find(query)
        .populate('leadId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const stats = {
      totalSales,
      totalAmount: totalAmount[0]?.total || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentSales
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get sales by customer ID
exports.getSalesByCustomerId = async (req, res) => {
  try {
      const { customerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const query = { 
      Customer: customer,
      company: req.user.company._id 
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const sales = await Sales.find(query)
      .populate('leadId', 'name email phone')
      .populate('invoices', 'invoiceNumber amount status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sales.countDocuments(query);

    // Calculate total amount for this customer
    const totalAmountResult = await Sales.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalAmount = totalAmountResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      totalAmount
    });

  } catch (error) {
    console.error('Error fetching sales by customer ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
