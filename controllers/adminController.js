const Admin = require('../models/Admin'); 
const Plan = require('../models/Plan');
 // Adjust the path as per your project
const mongoose = require('mongoose');

exports.createAdmin = async (req, res) => {
  try {
    const {
      company,
      plans,
      dateOfExpiry,
      billings,
      paymentHistory
    } = req.body;

    if (!company || !dateOfExpiry) {
      return res.status(400).json({ message: 'Company and dateOfExpiry are required.' });
    }

    const newAdmin = new Admin({
      company,
      plans,
      dateOfExpiry,
      billings,
      paymentHistory
    });

    const savedAdmin = await newAdmin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: savedAdmin
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .populate('company', 'name')             // Populate company name
      .populate('plans', 'planName price')     // Populate plan details (adjust fields as needed)
      .populate('paymentHistory.bill', 'invoiceNumber amount date')  // Populate bill info in paymentHistory
      .exec();

    res.status(200).json({
      message: 'All admin data fetched successfully',
      admins
    });

  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.getAdminById = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId)
      .populate('company', 'name')          // Populate company name
      .populate('plans', 'planName price')  // Populate plan details (adjust fields as needed)
      .populate('paymentHistory.bill', 'invoiceNumber amount date') // Populate bill inside paymentHistory
      .exec();

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin data fetched successfully',
      admin
    });

  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const updateData = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('company', 'name')
    .populate('plans', 'planName price')
    .populate('paymentHistory.bill', 'invoiceNumber amount date');

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });

  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin deleted successfully',
      admin: deletedAdmin
    });

  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};