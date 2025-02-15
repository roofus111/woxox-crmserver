const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Employee = require("../models/HR");

exports.createAttendance = async (req, res) => {
    try {
        const {
            employeeId,
            date,
            status,
            checkInTime,
            checkOutTime,
            workHours,
            overtimeHours,
            breakTime,
            shiftDetails,
            leaveDetails,
            odDetails,
            notes
        } = req.body;

        // Ensure the user exists
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure the employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Convert the provided date to ensure only the date part is compared
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // **Check if attendance for the same employee & date already exists**
        const existingAttendance = await Attendance.findOne({
            employeeId: employeeId,
            date: {
                $gte: attendanceDate, // Start of the day
                $lt: new Date(attendanceDate.getTime() + 86400000) // Start of next day
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: "Attendance for this employee on the given date already exists" });
        }


        // Validate attendance status
        const validStatuses = ['Present', 'Absent', 'Late', 'Leave', 'Remote', 'OD', 'Half Day', 'LOP'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid attendance status" });
        }

        // Validate shift details
        if (shiftDetails) {
            const validShiftTypes = ['Morning', 'Afternoon', 'Night', 'Flexible'];
            if (shiftDetails.shiftType && !validShiftTypes.includes(shiftDetails.shiftType)) {
                return res.status(400).json({ message: "Invalid shift type" });
            }
        }

        // Validate leave details if status is "Leave"
        if (status === "Leave" && (!leaveDetails || !leaveDetails.leaveType)) {
            return res.status(400).json({ message: "Leave details are required for leave status" });
        }

        // Validate OD details if status is "OD"
        if (status === "OD" && (!odDetails || !odDetails.odReason)) {
            return res.status(400).json({ message: "OD details are required for OD status" });
        }

        // Create new attendance record
        const newAttendance = new Attendance({
            company: req.user.company._id,
            User: req.user._id,
            employeeId,
            date,
            status,
            checkInTime,
            checkOutTime,
            workHours,
            overtimeHours,
            breakTime,
            shiftDetails,
            leaveDetails,
            odDetails,
            notes,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save to database
        const savedAttendance = await newAttendance.save();

        return res.status(201).json({
            message: "Attendance recorded successfully",
            attendance: savedAttendance
        });
    } catch (error) {
        console.error("Error creating attendance:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getAttendanceByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate dates
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        // Ensure company ID exists in request
        if (!req.user || !req.user.company || !req.user.company._id) {
            return res.status(403).json({ message: "Unauthorized access: Company ID missing" });
        }

        const companyId = req.user.company._id;

        // Convert dates to remove time portion
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day

        // Fetch attendance records within the date range for the specific company
        const attendanceRecords = await Attendance.find({
            company: companyId,
            date: { $gte: start, $lte: end }
        })
        .populate("employeeId", "firstName lastName") // Populating employee details
        .populate("company", "name") // Populating company details
        .sort({ date: 1 }); // Sort by date ascending

        // If no records found
        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: "No attendance records found for the given date range" });
        }

        return res.status(200).json({
            message: "Attendance records fetched successfully",
            attendance: attendanceRecords
        });

    } catch (error) {
        console.error("Error fetching attendance:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getAttendanceByEmployeeIdAndDateRange = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query; // Extract dates from query parameters

        // Validate input
        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        // Ensure company ID exists in request
        if (!req.user || !req.user.company || !req.user.company._id) {
            return res.status(403).json({ message: "Unauthorized access: Company ID missing" });
        }

        const companyId = req.user.company._id;

        // Convert dates to remove time portion
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of the day

        // Fetch attendance records for the given employee within the date range
        const attendanceRecords = await Attendance.find({
            company: companyId,
            employeeId: employeeId,
            date: { $gte: start, $lte: end }
        })
        .populate("employeeId", "name") // Populating employee name
        .populate("company", "name") // Populating company name
        .sort({ date: -1 }); // Sort by date (latest first)

        // If no records found
        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: "No attendance records found for the given date range" });
        }

        return res.status(200).json({
            message: "Attendance records fetched successfully",
            attendance: attendanceRecords
        });

    } catch (error) {
        console.error("Error fetching attendance:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


exports.getAttendanceInsightsByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        // Validate input
        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required" });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        // Ensure company ID exists in request
        if (!req.user || !req.user.company || !req.user.company._id) {
            return res.status(403).json({ message: "Unauthorized access: Company ID missing" });
        }

        const companyId = req.user.company._id;

        // Convert dates to remove time portion
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch attendance records for the given employee within the date range
        const attendanceRecords = await Attendance.find({
            company: companyId,
            employeeId: employeeId,
            date: { $gte: start, $lte: end }
        })
        .populate("employeeId", "name") // Populating employee name
        .populate("company", "name") // Populating company name
        .sort({ date: -1 }); // Sort by date (latest first)

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: "No attendance records found for the given date range" });
        }

        // Calculate status count and total working hours
        let totalWorkingHours = 0;
        let totalOvertimeHours = 0;
        const statusCount = attendanceRecords.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            totalWorkingHours += record.workHours || 0; // Sum work hours
            totalOvertimeHours += record.overtimeHours || 0;
            return acc;
        }, {});

        return res.status(200).json({
            message: "Attendance insights fetched successfully",
            employee: attendanceRecords[0].employeeId,
            company: attendanceRecords[0].company,
            statusInsights: statusCount,
            totalWorkingHours: totalWorkingHours,
            totalOvertimeHours, // Total work hours over the period
            attendance: attendanceRecords
        });

    } catch (error) {
        console.error("Error fetching attendance insights:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


exports.getLeaveTypesByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required" });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        if (!req.user || !req.user.company || !req.user.company._id) {
            return res.status(403).json({ message: "Unauthorized access: Company ID missing" });
        }

        const companyId = req.user.company._id;

        // Convert dates
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Fetch leave records within date range
        const leaveRecords = await Attendance.find({
            employeeId,
            company: companyId,
            "leaveDetails.leaveType": { $ne: null },
            date: { $gte: start, $lte: end }
        }).select("leaveDetails.leaveType leaveDetails.leaveApprovalStatus date");

        // Initialize leave tracking
        let leaveStats = {
            "Sick Leave": { total: 0, approved: 0, pending: 0, rejected: 0 },
            "Casual Leave": { total: 0, approved: 0, pending: 0, rejected: 0 },
            "Annual Leave": { total: 0, approved: 0, pending: 0, rejected: 0 }
        };

        // Leave Policy Constants
        const TOTAL_ANNUAL_LEAVES = 14;
        let casualLeaveBalance = 0;
        let sickLeaveBalance = 0;
        let annualLeaveUsed = 0;

        // Process leave records
        leaveRecords.forEach((record) => {
            const { leaveType, leaveApprovalStatus } = record.leaveDetails;

            if (!leaveStats[leaveType]) {
                leaveStats[leaveType] = { total: 0, approved: 0, pending: 0, rejected: 0 };
            }

            leaveStats[leaveType].total += 1;
            leaveStats[leaveType][leaveApprovalStatus.toLowerCase()] += 1;

            // Count used Annual Leave
            if (leaveType === "Annual Leave" && leaveApprovalStatus === "Approved") {
                annualLeaveUsed += 1;
            }
        });

        // Calculate Remaining Leaves
        let currentMonth = new Date(start).getMonth();
        let currentYear = new Date(start).getFullYear();

        for (let month = 0; month <= new Date(end).getMonth(); month++) {
            casualLeaveBalance += 1; // Carry-forward CL
            sickLeaveBalance = 1; // Reset SL every month
        }

        // Remaining Annual Leave
        let annualLeaveRemaining = TOTAL_ANNUAL_LEAVES - annualLeaveUsed;

        // Add remaining leave count
        leaveStats["Sick Leave"].remaining = sickLeaveBalance;
        leaveStats["Casual Leave"].remaining = casualLeaveBalance;
        leaveStats["Annual Leave"].remaining = annualLeaveRemaining;

        return res.status(200).json({
            message: "Leave statistics fetched successfully",
            leaveStats,
            remainingLeaves: {
                "Sick Leave": sickLeaveBalance,
                "Casual Leave": casualLeaveBalance,
                "Annual Leave": annualLeaveRemaining
            }
        });

    } catch (error) {
        console.error("Error fetching leave statistics:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// Update Attendance by ID
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Ensure updatedAt is set automatically
        updateData.updatedAt = Date.now();

        // Find and update the attendance record
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedAttendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.status(200).json({ message: "Attendance updated successfully", data: updatedAttendance });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the attendance record
        const deletedAttendance = await Attendance.findByIdAndDelete(id);

        if (!deletedAttendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.status(200).json({ message: "Attendance record deleted successfully", data: deletedAttendance });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
