const Payroll = require('../models/Payroll');
const BankAccount = require('../models/Account');

// Create Payroll
exports.createPayroll = async (req, res) => {
  try {
    const {
      employeeId, employeeName, department, monthlySalary,
      totalWorkingDays, daysWorked, extraEarnings, deductions,
      tax, paymentDate, paymentMethod, bankAccountId
    } = req.body;

    if (!employeeId || !employeeName || !department || !monthlySalary || !totalWorkingDays || !daysWorked || !paymentDate || !paymentMethod || !bankAccountId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const baseSalary = (monthlySalary / totalWorkingDays) * daysWorked;
    const totalExtraEarnings = extraEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const totalDeductions = deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const netSalary = baseSalary + totalExtraEarnings - totalDeductions - tax;

    // Find the bank account
    const bankAccountDoc = await BankAccount.findById(bankAccountId);
    if (!bankAccountDoc) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Check if sufficient balance
    if (bankAccountDoc.balance < netSalary) {
      return res.status(400).json({ message: 'Insufficient balance in bank account' });
    }

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      employeeName,
      department,
      monthlySalary,
      totalWorkingDays,
      daysWorked,
      baseSalary,
      extraEarnings,
      totalExtraEarnings,
      deductions,
      totalDeductions,
      tax,
      netSalary,
      paidAmount: netSalary, // Set paid amount to net salary since we're paying in full
      remainingSalary: 0,
      paymentDate,
      paymentMethod,
      paymentStatus: 'Paid',
      bankAccountId
    });

    // Create transaction in bank account
    const transaction = {
      company: bankAccountDoc.company,
      date: paymentDate,
      type: 'expense',
      amount: netSalary,
      description: `Salary payment for ${employeeName}`,
      category: 'Salary',
      paymentMethod: paymentMethod
    };

    // Add transaction to bank account
    await bankAccountDoc.addTransaction(transaction, req.user._id);

    // Save payroll record
    await payroll.save();

    return res.status(201).json({ 
      message: 'Payroll created and payment processed successfully', 
      payroll,
      bankAccount: {
        id: bankAccountDoc._id,
        newBalance: bankAccountDoc.balance
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Payrolls
exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find();
    return res.status(200).json(payrolls);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get Payroll by ID
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    return res.status(200).json(payroll);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update Payroll
exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    return res.status(200).json({ message: 'Payroll updated successfully', payroll });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete Payroll
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    return res.status(200).json({ message: 'Payroll deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get Payrolls by Employee ID
exports.getPayrollByEmployeeId = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employeeId: req.params.employeeId });
    if (!payrolls.length) return res.status(404).json({ message: 'No payroll records found for this employee' });
    return res.status(200).json(payrolls);
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
