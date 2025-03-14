const Account = require('../models/Account');

exports.addBankAccount = async (req, res) => {
  try {
    const accountData = {
      accountName: req.body.accountName,
      accountNumber: req.body.accountNumber,
      bankName: req.body.bankName,
      branchName: req.body.branchName,
      ifscCode: req.body.ifscCode,
      accountType: req.body.accountType,
      currency: req.body.currency || 'USD',
      company: req.user.company._id,
      createdBy: req.user._id,
      initialBalance: req.body.initialBalance || 0,
      balance: req.body.initialBalance || 0,
      openingDate: req.body.openingDate || Date.now(),
      isActive: req.body.isActive ?? true,
      notes: req.body.notes
    };

    const newAccount = new Account(accountData);
    const savedAccount = await newAccount.save();
    
    res.status(201).json({
      success: true,
      data: savedAccount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBankAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ 
      company: req.user.company._id,
      // isActive: true 
    });

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getBankAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateBankAccount = async (req, res) => {
  try {
    const updateData = {
      accountName: req.body.accountName,
      bankName: req.body.bankName,
      branchName: req.body.branchName,
      ifscCode: req.body.ifscCode,
      accountType: req.body.accountType,
      currency: req.body.currency,
      accountNumber: req.body.accountNumber,
      balance: req.body.balance,
      isActive: req.body.isActive,
      initialBalance: req.body.initialBalance,
      openingDate: req.body.openingDate,
      notes: req.body.notes
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const updatedAccount = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company._id,
        isActive: true
      },
      updateData,
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedAccount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.toggleBankAccountStatus = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      company: req.user.company._id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    // Toggle the isActive status
    const newStatus = !account.isActive;

    // Update the status
    account.isActive = newStatus;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Bank account ${newStatus ? 'enabled' : 'disabled'} successfully`,
      data: account
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { 
      company,
      type,
      amount,
      description,
      category,
      paymentMethod,
      reference,
      date 
    } = req.body;

    // Find the bank account and include createdBy field
    const bankAccount = await Account.findById(accountId);
    
    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    // Set createdBy if it's not already set
    if (!bankAccount.createdBy) {
      bankAccount.createdBy = req.user._id;  // Assuming req.user is set by auth middleware
    }

    // Create transaction data object
    const transactionData = {
      company:req.user.company._id,
      type,
      amount,
      description,
      category,
      paymentMethod,
      reference,
      date: date || new Date()
    };

    // Add transaction using the model method
    await bankAccount.addTransaction(transactionData, req.user._id);

    return res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: bankAccount
    });

  } catch (error) {
    console.error('Transaction error:', error); // For debugging
    return res.status(500).json({
      success: false,
      message: 'Error adding transaction',
      error: error.message
    });
  }
};
