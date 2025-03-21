const Payroll = require('../models/Payroll');
const BankAccount = require('../models/Account');

// Create Payroll
exports.createPayroll = async (req, res) => {
  try {
    const {
      employeeId, employeeName, department, monthlySalary,
      totalWorkingDays, daysWorked, extraEarnings, deductions,
      tax, paymentDate, paymentMethod
    } = req.body;

    if (!employeeId || !employeeName || !department || !monthlySalary || !totalWorkingDays || !daysWorked || !paymentDate || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const baseSalary = (monthlySalary / totalWorkingDays) * daysWorked;
    const totalExtraEarnings = extraEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const totalDeductions = deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const netSalary = baseSalary + totalExtraEarnings - totalDeductions - tax;

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
      paidAmount: 0,
      remainingSalary: netSalary,
      paymentDate,
      paymentMethod,
      paymentStatus: 'Pending',
    });

    await payroll.save();
    return res.status(201).json({ message: 'Payroll created successfully', payroll });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error', error });
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

// Add Partial Payment
exports.addPartialPayment = async (req, res) => {
  try {
    const { amountPaid, paymentMethod } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    if (amountPaid <= 0) return res.status(400).json({ message: 'Invalid payment amount' });
    if (payroll.remainingSalary <= 0) return res.status(400).json({ message: 'Salary already fully paid' });

    payroll.paymentHistory.push({ amountPaid, paymentMethod, paymentDate: new Date() });
    payroll.paidAmount += amountPaid;
    payroll.remainingSalary = payroll.netSalary - payroll.paidAmount;
    payroll.paymentStatus = payroll.paidAmount === payroll.netSalary ? 'Paid' : 'Half Paid';

    await payroll.save();
    return res.status(200).json({ message: 'Payment added successfully', payroll });

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