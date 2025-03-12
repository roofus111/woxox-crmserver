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
      company: req.user.company._id
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
      isActive: true 
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
      currency: req.body.currency
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company._id,
        isActive: true
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.disableBankAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company._id,
        isActive: true
      },
      { 
        isActive: false,
        allowIncomingTransactions: false,
        allowOutgoingTransactions: false,
        disabledAt: new Date()
      },
      {
        new: true
      }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found or already disabled'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bank account disabled successfully',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { type, amount, description, category, paymentMethod, reference } = req.body;
    const userId = req.user.id; // Assuming you have user info from auth middleware

    // Find the bank account with its current state
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Store previous balance for history
    const previousBalance = account.balance;

    // Create transaction data object
    const transactionData = {
      type,
      amount,
      description,
      category,
      paymentMethod,
      reference,
      date: new Date()
    };

    // Create detailed history entry
    const historyEntry = {
      transaction: null, // Will be updated after transaction is created
      action: 'created',
      performedBy: userId,
      previousState: {
        balance: previousBalance,
        transactionCount: account.transactions.length
      },
      newState: {
        transactionDetails: transactionData,
        expectedBalance: type === 'income' 
          ? previousBalance + amount 
          : previousBalance - amount
      },
      timestamp: new Date()
    };

    // Add transaction using the schema method
    await account.addTransaction(transactionData, userId);

    // Add additional history metadata
    const newTransaction = account.transactions[account.transactions.length - 1];
    historyEntry.transaction = newTransaction._id;
    historyEntry.newState.actualBalance = account.balance;
    account.transactionHistory.push(historyEntry);

    // Save the updated account with new history
    await account.save();

    // Return response with transaction and history details
    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction: newTransaction,
      history: historyEntry,
      currentBalance: account.balance
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

