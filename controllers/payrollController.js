const Attendance = require('../models/Attendance');
const Employee = require('../models/HR');
const Payroll = require('../models/Payroll');

exports.getPayrollDetails = async (req, res) => {
    const { month, year } = req.body;
    const companyId = req.user.company._id; // Get company ID from the request

    try {
        const payrollDetails = [];

        // Fetch employees for the specific company
        const employees = await Employee.find({ company: companyId });

        for (const employee of employees) {
            // Fetch attendance records for the specific month and year
            const attendanceRecords = await Attendance.find({
                employeeId: employee._id,
                date: {
                    $gte: new Date(year, month - 1, 1),
                    $lt: new Date(year, month, 1)
                }
            });

            // Calculate total working days, days worked, and other payroll details
            const totalWorkingDays = attendanceRecords.length; // Adjust based on your business logic
            const daysWorked = attendanceRecords.filter(record => record.status === 'Present').length;
            const monthlySalary = employee.salary; // Assuming salary is stored in Employee model

            payrollDetails.push({
                employeeId: employee._id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department,
                monthlySalary,
                totalWorkingDays,
                daysWorked,
                paymentDate: new Date(year, month - 1, 1), // Set payment date to the first of the month
                paymentMethod: 'Bank Transfer', // Example payment method
                paymentStatus: 'Pending' // Initial status
            });
        }

        res.status(200).json({ payrollDetails });
    } catch (err) {
        console.error('Error fetching payroll details:', err);
        res.status(500).json({ message: 'Error fetching payroll details', error: err.message });
    }
};

exports.approvePayroll = async (req, res) => {
    const { month, year, extraEarnings, deductions, employeeId } = req.body;
    const companyId = req.user.company._id; // Get company ID from the request

    try {
        // Fetch the specific employee
        const employee = await Employee.findOne({ _id: employeeId, company: companyId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check if payroll already exists for the employee in the specified month and year
        const existingPayroll = await Payroll.findOne({
            employeeId: employee._id,
            paymentDate: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        });

        if (existingPayroll) {
            return res.status(400).json({ message: 'Payroll already created for this employee in the specified month' });
        }

        // Fetch attendance records for the specific month and year
        const attendanceRecords = await Attendance.find({
            employeeId: employee._id,
            date: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        });

        // Calculate total working days, days worked, and other payroll details
        const totalWorkingDays = attendanceRecords.length; // Adjust based on your business logic
        const daysWorked = attendanceRecords.filter(record => record.status === 'Present').length;
        const monthlySalary = employee.salary; // Assuming salary is stored in Employee model

        // Calculate total extra earnings and deductions
        const totalExtraEarnings = (extraEarnings || []).reduce((sum, earning) => sum + earning.amount, 0);
        const totalDeductions = (deductions || []).reduce((sum, deduction) => sum + deduction.amount, 0);

        // Calculate final amount
        const finalAmount = monthlySalary + totalExtraEarnings - totalDeductions;

        // Create payroll entry
        const payroll = new Payroll({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            department: employee.department,
            monthlySalary,
            totalWorkingDays,
            daysWorked,
            paymentDate: new Date(year, month - 1, 1), // Set payment date to the first of the month
            paymentMethod: 'Bank Transfer', // Example payment method
            paymentStatus: 'Pending', // Set status to Approved
            extraEarnings: extraEarnings || [], // Include any extra earnings
            deductions: deductions || [] // Include any deductions
        });

        // Save payroll entry
        const savedPayroll = await payroll.save(); // Save and get the saved payroll entry

        res.status(201).json({
            message: 'Payroll approved and created successfully',
            payroll: {
                id: savedPayroll._id,
                employeeId: savedPayroll.employeeId,
                employeeName: savedPayroll.employeeName,
                department: savedPayroll.department,
                monthlySalary: savedPayroll.monthlySalary,
                totalWorkingDays: savedPayroll.totalWorkingDays,
                daysWorked: savedPayroll.daysWorked,
                paymentDate: savedPayroll.paymentDate,
                paymentMethod: savedPayroll.paymentMethod,
                paymentStatus: savedPayroll.paymentStatus,
                extraEarnings: savedPayroll.extraEarnings,
                deductions: savedPayroll.deductions,
                finalAmount
            }
        });
    } catch (err) {
        console.error('Error approving payroll:', err);
        res.status(500).json({ message: 'Error approving payroll', error: err.message });
    }
};
