const mongoose = require('mongoose');
const { CompanyPurchase } = require('../models/Plan');
const Company = require('../models/Company');
const Billing = require('../models/Billing');

// Create a new company purchase plan

exports.createCompanyPurchase = async (req, res) => {
  try {
    const {
      modules,
      validTill,
      planType,
      leadLimit,
      campaignLimit,
      autoRenew,
      paymentMethod,
      billingInfo,
      paymentInfo
    } = req.body;

    const companyId = req.user.company._id;
    // 1. Basic validation
    if (!companyId || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({
        error: "Company ID and at least one module are required",
      });
    }

    // 2. Validate ObjectId format early
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        error: "Invalid company ID format",
      });
    }

    // 3. Check company existence
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        error: "Company not found",
      });
    }

    // 4. Check if purchase already exists
    const existingPurchase = await CompanyPurchase.findOne({ companyId });
    if (existingPurchase) {
      return res.status(400).json({
        error:
          "Company already has a purchase plan. Please upgrade/cancel the existing plan to create a new one.",
      });
    }

    // 5. Create purchase
    const newCompanyPurchase = new CompanyPurchase({
      companyId,
      modules,
      validTill,
      planType,
      leadLimit,
      campaignLimit,
      autoRenew,
      paymentMethod,
    });

    const savedPurchase = await newCompanyPurchase.save();

    // 6. Create billing info if provided
    if (billingInfo && paymentInfo) {
      const billing = new Billing({
        companyId: companyId,
        firstName: billingInfo.firstName,
        lastName: billingInfo.lastName,
        email: billingInfo.email,
        phone: billingInfo.phone,
        address: {
          country: billingInfo.country,
          zipPostalCode: billingInfo.zipCode,
          streetAddress: billingInfo.address,
          city: billingInfo.city,
          stateProvince: billingInfo.state,
        },
        Plan: savedPurchase._id,
        Payment: {
          subtotal: paymentInfo.subtotal,
          tax: paymentInfo.tax,
          total: paymentInfo.total,
          finalTotal: paymentInfo.finalTotal,
          originalTotal: paymentInfo.originalTotal,
          planCost: paymentInfo.planCost,
          productsCost: paymentInfo.productsCost,
          additionalUsersCost: paymentInfo.additionalUsersCost,
        },
      });

      await billing.save();
    }

    // 7. Respond success
    return res.status(201).json({
      message: "Company purchase plan created successfully",
      purchase: savedPurchase,
    });
  } catch (error) {
    console.error("Error creating company purchase plan:", error);
    return res.status(500).json({
      error: "An error occurred while creating the purchase plan",
      details: error.message,
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

// Uninstall addon from a plan (deactivate instead of remove)
exports.uninstallAddons = async (req, res) => {
  try {
    const companyId = req.user.company._id;
    const { planId } = req.params;
    const { addonId } = req.body; // Expecting single addon ID to uninstall
    const planIndex = 0;

    // Validate input
    if (!addonId || typeof addonId !== 'string') {
      return res.status(400).json({ 
        error: 'Single addon ID is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ 
        error: 'Invalid plan ID format' 
      });
    }

    // Find the plan first to get the addon details
    const plan = await CompanyPurchase.findOne({ 
      _id: planId, 
      companyId: companyId 
    });

    if (!plan) {
      return res.status(404).json({ 
        error: 'No matching plan found for this company' 
      });
    }

    // Find the specific addon to uninstall
    const addonToUninstall = plan.modules?.[planIndex]?.plans?.[planIndex]?.moduleAccess?.find(
      addon => addon._id == addonId
    );

    if (!addonToUninstall) {
      return res.status(404).json({ 
        error: 'Addon not found in this plan' 
      });
    }

    // Calculate expire date (activatedDate + 30 days)
    const activatedDate = new Date(addonToUninstall.activatedDate);
    const expireDate = new Date(activatedDate);
    expireDate.setDate(expireDate.getDate() + 30);

    // Update the addon to inactive status
    const updatedPlan = await CompanyPurchase.findOneAndUpdate(
      { 
        _id: planId, 
        companyId: companyId,
        [`modules.${planIndex}.plans.${planIndex}.moduleAccess._id`]: addonId
      },
      {
        $set: {
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess.$.isActive`]: false,
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess.$.deactivatedDate`]: new Date(),
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess.$.expireOn`]: expireDate,
        }
      },
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ 
        error: 'Failed to update addon status' 
      });
    }

    // Get the updated addon for response
    const updatedAddon = updatedPlan.modules?.[planIndex]?.plans?.[planIndex]?.moduleAccess?.find(
      addon => addon._id === addonId
    );

    res.status(200).json({
      message: 'Addon uninstalled successfully (deactivated)',
      data: {
        uninstalledAddon: updatedAddon,
        deactivatedDate: updatedAddon?.deactivatedDate,
        expireOn: updatedAddon?.expireOn,
        autoRenew: updatedPlan.autoRenew
      }
    });
  } catch (error) {
    console.error('Error uninstalling addon:', error);
    res.status(500).json({ 
      error: 'An error occurred while uninstalling addon',
      details: error.message 
    });
  }
};

// Install addon to a plan (reactivate)
exports.installAddons = async (req, res) => {
  try {
    const companyId = req.user.company._id;
    const { planId } = req.params;
    const { addonId } = req.body; // Expecting single addon ID to install/reactivate
    const planIndex = 0;

    // Validate input
    if (!addonId || typeof addonId !== 'string') {
      return res.status(400).json({ 
        error: 'Single addon ID is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ 
        error: 'Invalid plan ID format' 
      });
    }

    // Find the plan first to get the addon details
    const plan = await CompanyPurchase.findOne({ 
      _id: planId, 
      companyId: companyId 
    });

    if (!plan) {
      return res.status(404).json({ 
        error: 'No matching plan found for this company' 
      });
    }

    // Find the specific addon to install/reactivate
    const addonToInstall = plan.modules?.[planIndex]?.plans?.[planIndex]?.moduleAccess?.find(
      addon => addon._id == addonId
    );

    if (!addonToInstall) {
      return res.status(404).json({ 
        error: 'Addon not found in this plan' 
      });
    }

    // Update the addon to active status and remove deactivation info
    const updatedPlan = await CompanyPurchase.findOneAndUpdate(
      { 
        _id: planId, 
        companyId: companyId,
        [`modules.${planIndex}.plans.${planIndex}.moduleAccess._id`]: addonId
      },
      {
        $set: {
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess.$.isActive`]: true
        },
        $unset: {
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess.$.deactivatedDate`]: "",
          [`modules.${planIndex}.plans.${planIndex}.moduleAccess.$.expireOn`]: ""
        }
      },
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ 
        error: 'Failed to update addon status' 
      });
    }

    // Get the updated addon for response
    const updatedAddon = updatedPlan.modules?.[planIndex]?.plans?.[planIndex]?.moduleAccess?.find(
      addon => addon._id === addonId
    );

    res.status(200).json({
      message: 'Addon installed successfully (reactivated)',
      data: {
        installedAddon: updatedAddon,
        activatedDate: updatedAddon?.activatedDate,
        isActive: updatedAddon?.isActive
      }
    });
  } catch (error) {
    console.error('Error installing addon:', error);
    res.status(500).json({ 
      error: 'An error occurred while installing addon',
      details: error.message 
    });
  }
};