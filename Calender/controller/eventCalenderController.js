const Event = require("../model/eventCalender");

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { title, mode, startTime, endTime, priority, description, status, dueDate, assignee } = req.body;

        // Validation
        if (!title || !mode || !startTime || !endTime || !dueDate || !assignee) {
            return res.status(400).json({ success: false, message: "All required fields must be provided" });
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ success: false, message: "End time must be after start time" });
        }

        // Create the event
        const event = new Event({
            company: req.user.company._id,
            user: req.user._id,
            assignee,
            title,
            mode,
            startTime,
            endTime,
            priority,
            description,
            status,
            dueDate,
        });

        await event.save();
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Get all events for the user's company
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ company: req.user.company._id })
            .populate("user", "name email")
            .populate("assignee", "name email")
            .sort({ startTime: 1 });

        res.status(200).json({ success: true, data: events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Get a single event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, company: req.user.company._id })
            .populate("user", "name email")
            .populate("assignee", "name email");

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        res.status(200).json({ success: true, data: event });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Update an event
exports.updateEvent = async (req, res) => {
    try {
        const { title, mode, startTime, endTime, priority, description, status, dueDate, assignee } = req.body;

        let event = await Event.findOne({ _id: req.params.id, company: req.user.company._id });

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ success: false, message: "End time must be after start time" });
        }

        event.title = title || event.title;
        event.mode = mode || event.mode;
        event.startTime = startTime || event.startTime;
        event.endTime = endTime || event.endTime;
        event.priority = priority || event.priority;
        event.description = description || event.description;
        event.status = status || event.status;
        event.dueDate = dueDate || event.dueDate;
        event.assignee = assignee || event.assignee;

        await event.save();
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, company: req.user.company._id });

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        await event.deleteOne();
        res.status(200).json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};
