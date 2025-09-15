const Billing = require('../models/Billing');
const Plan = require('../models/Plan');
const mongoose = require('mongoose');

// Create a new billing record
exports.createBilling = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      address,
      Plan: planId,
      Payment,
      status
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !companyName || !address || !planId || !Payment) {
      return res.status(400).json({
        error: 'All required fields must be provided'
      });
    }

    // Validate Plan exists
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        error: 'Invalid Plan ID format'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found'
      });
    }

    // Validate address structure
    if (!address.country || !address.zipPostalCode || !address.streetAddress || 
        !address.city || !address.stateProvince) {
      return res.status(400).json({
        error: 'All address fields are required'
      });
    }

    // Validate Payment structure
    if (!Payment.subtotal || !Payment.tax || !Payment.total || 
        !Payment.finalTotal || !Payment.originalTotal || 
        !Payment.planCost || !Payment.productsCost || !Payment.additionalUsersCost) {
      return res.status(400).json({
        error: 'All required payment fields must be provided'
      });
    }

    // Create new billing record
    const billingData = {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      address,
      Plan: planId,
      Payment,
      status: status || 'Pending'
    };

    const billing = new Billing(billingData);
    const savedBilling = await billing.save();

    // Populate the Plan reference
    await savedBilling.populate('Plan');

    res.status(201).json({
      message: 'Billing record created successfully',
      billing: savedBilling
    });
  } catch (error) {
    console.error('Error creating billing record:', error);
    res.status(500).json({
      error: 'An error occurred while creating the billing record',
      details: error.message
    });
  }
};

// Get all billing records
exports.getAllBillings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const billings = await Billing.find(filter)
      .populate('Plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Billing.countDocuments(filter);

    res.status(200).json({
      message: 'Billing records retrieved successfully',
      billings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + billings.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving billing records',
      details: error.message
    });
  }
};

// Get billing record by ID
exports.getBillingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid billing ID format'
      });
    }

    const billing = await Billing.findById(id).populate('Plan');

    if (!billing) {
      return res.status(404).json({
        error: 'Billing record not found'
      });
    }

    res.status(200).json({
      message: 'Billing record retrieved successfully',
      billing
    });
  } catch (error) {
    console.error('Error fetching billing record:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving the billing record',
      details: error.message
    });
  }
};

// Get billing records by email
exports.getBillingsByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        error: 'Email parameter is required'
      });
    }

    const billings = await Billing.find({ email })
      .populate('Plan')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Billing records retrieved successfully',
      billings
    });
  } catch (error) {
    console.error('Error fetching billing records by email:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving billing records',
      details: error.message
    });
  }
};

// Get billing records by company name
exports.getBillingsByCompany = async (req, res) => {
  try {
    const { companyName } = req.params;

    if (!companyName) {
      return res.status(400).json({
        error: 'Company name parameter is required'
      });
    }

    const billings = await Billing.find({ companyName })
      .populate('Plan')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Billing records retrieved successfully',
      billings
    });
  } catch (error) {
    console.error('Error fetching billing records by company:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving billing records',
      details: error.message
    });
  }
};

// Update billing record
exports.updateBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid billing ID format'
      });
    }

    // Validate Plan exists if being updated
    if (updates.Plan) {
      if (!mongoose.Types.ObjectId.isValid(updates.Plan)) {
        return res.status(400).json({
          error: 'Invalid Plan ID format'
        });
      }

      const plan = await Plan.findById(updates.Plan);
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found'
        });
      }
    }

    // Validate status if being updated
    if (updates.status) {
      const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          error: 'Invalid status. Must be one of: Pending, Paid, Failed, Refunded'
        });
      }
    }

    const updatedBilling = await Billing.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('Plan');

    if (!updatedBilling) {
      return res.status(404).json({
        error: 'Billing record not found'
      });
    }

    res.status(200).json({
      message: 'Billing record updated successfully',
      billing: updatedBilling
    });
  } catch (error) {
    console.error('Error updating billing record:', error);
    res.status(500).json({
      error: 'An error occurred while updating the billing record',
      details: error.message
    });
  }
};

// Update billing status
exports.updateBillingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid billing ID format'
      });
    }

    const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: Pending, Paid, Failed, Refunded'
      });
    }

    const updatedBilling = await Billing.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('Plan');

    if (!updatedBilling) {
      return res.status(404).json({
        error: 'Billing record not found'
      });
    }

    res.status(200).json({
      message: 'Billing status updated successfully',
      billing: updatedBilling
    });
  } catch (error) {
    console.error('Error updating billing status:', error);
    res.status(500).json({
      error: 'An error occurred while updating the billing status',
      details: error.message
    });
  }
};

// Delete billing record
exports.deleteBilling = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid billing ID format'
      });
    }

    const deletedBilling = await Billing.findByIdAndDelete(id);

    if (!deletedBilling) {
      return res.status(404).json({
        error: 'Billing record not found'
      });
    }

    res.status(200).json({
      message: 'Billing record deleted successfully',
      billing: deletedBilling
    });
  } catch (error) {
    console.error('Error deleting billing record:', error);
    res.status(500).json({
      error: 'An error occurred while deleting the billing record',
      details: error.message
    });
  }
};

// Get billing statistics
exports.getBillingStats = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$Payment.finalTotal' }
        }
      }
    ]);

    const totalBillings = await Billing.countDocuments();
    const totalRevenue = await Billing.aggregate([
      {
        $match: { status: 'Paid' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$Payment.finalTotal' }
        }
      }
    ]);

    res.status(200).json({
      message: 'Billing statistics retrieved successfully',
      stats: {
        byStatus: stats,
        totalBillings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching billing statistics:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving billing statistics',
      details: error.message
    });
  }
};

// Get billing records by status
exports.getBillingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: Pending, Paid, Failed, Refunded'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const billings = await Billing.find({ status })
      .populate('Plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Billing.countDocuments({ status });

    res.status(200).json({
      message: `${status} billing records retrieved successfully`,
      billings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + billings.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching billing records by status:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving billing records',
      details: error.message
    });
  }
};
