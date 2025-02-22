const EmployeeSchedule = require("../model/employeeSchedule");

// Create a new Employee Schedule
exports.createEmployeeSchedule = async (req, res) => {
    try {
        const { employee, shifts, assignedTasks, assignedEvents, status } = req.body;

        // Basic validation
        if (!employee) {
            return res.status(400).json({ success: false, message: "Employee ID is required" });
        }

        if (!shifts || shifts.length === 0) {
            return res.status(400).json({ success: false, message: "At least one shift is required" });
        }

        // Create a new schedule
        const employeeSchedule = new EmployeeSchedule({
            employee,
            company: req.user.company._id, // Assuming user is logged in
            shifts,
            assignedTasks: assignedTasks || [],
            assignedEvents: assignedEvents || [],
            status: status || "Active",
        });

        await employeeSchedule.save();
        res.status(201).json({ success: true, data: employeeSchedule });

    } catch (error) {
        console.error("Error creating employee schedule:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Get all Employee Schedules for a Company
exports.getEmployeeSchedules = async (req, res) => {
    try {
        const schedules = await EmployeeSchedule.find({ company: req.user.company._id })
            .populate("employee", "name email") // Populate Employee details
            .populate("assignedTasks", "taskTitle status priority dueDate") // Populate Task details
            .populate("assignedEvents", "title mode startTime endTime status"); // Populate Event details

        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        console.error("Error fetching employee schedules:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Get a Single Employee Schedule by ID
exports.getEmployeeScheduleById = async (req, res) => {
    try {
        const schedule = await EmployeeSchedule.findOne({ 
            _id: req.params.id, 
            company: req.user.company._id 
        })
        .populate("employee", "name email")
        .populate("assignedTasks", "taskTitle status priority dueDate")
        .populate("assignedEvents", "title mode startTime endTime status");

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Employee schedule not found" });
        }

        res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        console.error("Error fetching employee schedule:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Update an Employee Schedule
exports.updateEmployeeSchedule = async (req, res) => {
    try {
        const { shifts, assignedTasks, assignedEvents, status } = req.body;

        // Find and update the schedule
        const schedule = await EmployeeSchedule.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company._id }, // Ensure the schedule belongs to the logged-in user's company
            { $set: { shifts, assignedTasks, assignedEvents, status } },
            { new: true, runValidators: true } // Return updated document and run validators
        )
        .populate("employee", "name email")
        .populate("assignedTasks", "taskTitle status priority dueDate")
        .populate("assignedEvents", "title mode startTime endTime status");

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Employee schedule not found" });
        }

        res.status(200).json({ success: true, data: schedule });

    } catch (error) {
        console.error("Error updating employee schedule:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Delete an Employee Schedule
exports.deleteEmployeeSchedule = async (req, res) => {
    try {
        const schedule = await EmployeeSchedule.findOneAndDelete({
            _id: req.params.id,
            company: req.user.company._id, // Ensure the schedule belongs to the logged-in user's company
        });

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Employee schedule not found" });
        }

        res.status(200).json({ success: true, message: "Employee schedule deleted successfully" });

    } catch (error) {
        console.error("Error deleting employee schedule:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};
