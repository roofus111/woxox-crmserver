const mongoose = require('mongoose');
const { CompanyPurchase } = require('../models/Plan');
const Company = require('../models/Company');

// Create a new company purchase plan
exports.createCompanyPurchase = async (req, res) => {
  try {
    const {
      companyId,
      modules,
      validTill,
      planType,
      employeeLimit,
      autoRenew,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!companyId || !modules || !modules.length) {
      return res.status(400).json({ 
        error: 'Company ID and modules are required' 
      });
    }

    // Validate company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        error: 'Company not found' 
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ 
        error: 'Invalid company ID format' 
      });
    }
const companyPurchase = await CompanyPurchase.findOne({companyId});
if(companyPurchase){
  return res.status(400).json({
    error: 'Company already has a purchase plan, Please upgrade/cancel the existing plan to create a new one'
  });
}

    // Create new company purchase
    const newCompanyPurchase = new CompanyPurchase({
      companyId,
      modules,
      validTill,
      planType,
      employeeLimit,
      autoRenew,
      paymentMethod
    });

    const savedPurchase = await newCompanyPurchase.save();

    res.status(201).json({
      message: 'Company purchase plan created successfully',
      purchase: savedPurchase
    });
  } catch (error) {
    console.error('Error creating company purchase plan:', error);
    res.status(500).json({
      error: 'An error occurred while creating the purchase plan',
      details: error.message
    });
  }
};

// Get all company purchase plans
exports.getAllCompanyPurchases = async (req, res) => {
  try {
    const purchases = await CompanyPurchase.find()
      .populate('companyId', 'name email industry')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      message: 'Company purchase plans retrieved successfully',
      purchases
    });
  } catch (error) {
    console.error('Error fetching company purchase plans:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving purchase plans',
      details: error.message
    });
  }
};

// Get company purchase plan by ID
exports.getCompanyPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid purchase plan ID format' 
      });
    }

    const purchase = await CompanyPurchase.findById(id)
      .populate('companyId', 'name email industry');

    if (!purchase) {
      return res.status(404).json({ 
        error: 'Purchase plan not found' 
      });
    }

    res.status(200).json({
      message: 'Purchase plan retrieved successfully',
      purchase
    });
  } catch (error) {
    console.error('Error fetching purchase plan:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving the purchase plan',
      details: error.message
    });
  }
};

// Get purchase plans by company ID
exports.getCompanyPurchasesByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ 
        error: 'Invalid company ID format' 
      });
    }

    const purchases = await CompanyPurchase.find({ companyId })
      .populate('companyId', 'name email industry')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      message: 'Company purchase plans retrieved successfully',
      purchases
    });
  } catch (error) {
    console.error('Error fetching company purchase plans:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving purchase plans',
      details: error.message
    });
  }
};

// Update company purchase plan
exports.updateCompanyPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid purchase plan ID format' 
      });
    }

    // Validate company exists if companyId is being updated
    if (updates.companyId && !mongoose.Types.ObjectId.isValid(updates.companyId)) {
      return res.status(400).json({ 
        error: 'Invalid company ID format' 
      });
    }

    if (updates.companyId) {
      const company = await Company.findById(updates.companyId);
      if (!company) {
        return res.status(404).json({ 
          error: 'Company not found' 
        });
      }
    }

    const updatedPurchase = await CompanyPurchase.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('companyId', 'name email industry');

    if (!updatedPurchase) {
      return res.status(404).json({ 
        error: 'Purchase plan not found' 
      });
    }

    res.status(200).json({
      message: 'Purchase plan updated successfully',
      purchase: updatedPurchase
    });
  } catch (error) {
    console.error('Error updating purchase plan:', error);
    res.status(500).json({
      error: 'An error occurred while updating the purchase plan',
      details: error.message
    });
  }
};

// Delete company purchase plan
exports.deleteCompanyPurchase = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid purchase plan ID format' 
      });
    }

    const deletedPurchase = await CompanyPurchase.findByIdAndDelete(id);

    if (!deletedPurchase) {
      return res.status(404).json({ 
        error: 'Purchase plan not found' 
      });
    }

    res.status(200).json({
      message: 'Purchase plan deleted successfully',
      purchase: deletedPurchase
    });
  } catch (error) {
    console.error('Error deleting purchase plan:', error);
    res.status(500).json({
      error: 'An error occurred while deleting the purchase plan',
      details: error.message
    });
  }
};

// Get active purchase plans
exports.getActivePurchasePlans = async (req, res) => {
  try {
    const activePurchases = await CompanyPurchase.find({ 
      status: 'active',
      validTill: { $gte: new Date() }
    })
    .populate('companyId', 'name email industry')
    .sort({ purchaseDate: -1 });

    res.status(200).json({
      message: 'Active purchase plans retrieved successfully',
      purchases: activePurchases
    });
  } catch (error) {
    console.error('Error fetching active purchase plans:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving active purchase plans',
      details: error.message
    });
  }
};

// Get expired purchase plans
exports.getExpiredPurchasePlans = async (req, res) => {
  try {
    const expiredPurchases = await CompanyPurchase.find({
      $or: [
        { status: 'expired' },
        { validTill: { $lt: new Date() } }
      ]
    })
    .populate('companyId', 'name email industry')
    .sort({ validTill: -1 });

    res.status(200).json({
      message: 'Expired purchase plans retrieved successfully',
      purchases: expiredPurchases
    });
  } catch (error) {
    console.error('Error fetching expired purchase plans:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving expired purchase plans',
      details: error.message
    });
  }
};

// Update purchase plan status
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid purchase plan ID format' 
      });
    }

    const validStatuses = ['active', 'inactive', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: active, inactive, expired, cancelled' 
      });
    }

    const updatedPurchase = await CompanyPurchase.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('companyId', 'name email industry');

    if (!updatedPurchase) {
      return res.status(404).json({ 
        error: 'Purchase plan not found' 
      });
    }

    res.status(200).json({
      message: 'Purchase plan status updated successfully',
      purchase: updatedPurchase
    });
  } catch (error) {
    console.error('Error updating purchase plan status:', error);
    res.status(500).json({
      error: 'An error occurred while updating the purchase plan status',
      details: error.message
    });
  }
};

// Get purchase plans by plan type
exports.getPurchasePlansByType = async (req, res) => {
  try {
    const { planType } = req.params;
    const validTypes = ['free', 'basic', 'premium', 'enterprise'];

    if (!validTypes.includes(planType)) {
      return res.status(400).json({ 
        error: 'Invalid plan type. Must be one of: free, basic, premium, enterprise' 
      });
    }

    const purchases = await CompanyPurchase.find({ planType })
      .populate('companyId', 'name email industry')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      message: `${planType} purchase plans retrieved successfully`,
      purchases
    });
  } catch (error) {
    console.error('Error fetching purchase plans by type:', error);
    res.status(500).json({
      error: 'An error occurred while retrieving purchase plans by type',
      details: error.message
    });
  }
};
