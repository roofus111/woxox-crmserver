const LeadFollowUp = require("../models/followUp"); // Import the LeadFollowUp model
const Lead = require("../models/Lead"); // Assuming you have a Lead model
const LeadActivity = require("../models/LeadActivity"); // Assuming the model is in the models folder
const mongoose = require("mongoose");
const cron = require('node-cron');


function checkFollowUpsAndNotify() {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60*60*1000);

  LeadFollowUp.find({
    followUpDate: { $gte: now, $lt: nextHour },
    status: { $in: ['Pending', 'In Progress'] }
  })
  .then(followUps => {
    followUps.forEach(followUp => {
      io.emit('followUpReminder', {
        message: `Reminder: You have a follow-up scheduled at ${followUp.followUpDate}`,
        details: followUp
      });
    });
  })
  .catch(err => console.error('Error:', err));
}

cron.schedule('*/10 * * * *', checkFollowUpsAndNotify);

// Create a new follow-up
exports.createFollowUp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      leadId,
      followUpDate,
      status,
      notes,
      nextFollowUpDate,
      assignedTo,
    } = req.body;

    if (!leadId || !followUpDate || !status) {
      throw new Error("Missing required fields");
    }

    const lead = await Lead.findById(leadId).session(session);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const newFollowUp = new LeadFollowUp({
      company: req.user.company,
      leadId,
      followUpDate,
      status,
      notes,
      nextFollowUpDate,
      assignedTo: assignedTo.trim() ? assignedTo : req.user._id,
      createdBy: req.user._id,
    });

    const savedFollowUp = await newFollowUp.save({ session });

    const newActivity = new LeadActivity({
      leadId,
      userId: req.user._id,
      action: "followUp",
      details: `Created a new follow-up on ${followUpDate}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const savedActivity = await newActivity.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      followUp: savedFollowUp,
      activity: savedActivity,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

exports.getAllfollowUps = async (req, res) => {
  try {
    let searchCriteria = {}
    if(req.user.role =='user'){
       searchCriteria = { assignedTo : req.user._id, company: req.user.company,}
    }
    else {
       searchCriteria = {company: req.user.company}
  
    }

    console.log(searchCriteria);
    
    const followUp = await LeadFollowUp.find(
      searchCriteria
    )
      .populate("leadId")
      .populate("assignedTo",'name')
      .populate("createdBy",'name');
    res.status(200).json(followUp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all follow-ups for a specific lead
exports.getFollowUpsByLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    // Fetch all follow-ups for the given lead
    const followUps = await LeadFollowUp.find({ leadId }).populate(
      "assignedTo",
      "name email"
    ).populate("createdBy",'name');;

    if (followUps.length === 0) {
      return res
        .status(404)
        .json({ message: "No follow-ups found for this lead" });
    }

    res.status(200).json(followUps);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a follow-up
exports.updateFollowUp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { followUpId } = req.params;
    const { followUpDate, status, notes, nextFollowUpDate, assignedTo } = req.body;

    if (!followUpId || !status) { // Ensuring mandatory fields are present
      throw new Error("Missing required fields.");
    }

    const updatedFollowUp = await LeadFollowUp.findByIdAndUpdate(
      followUpId,
      {
        followUpDate,
        status,
        notes,
        nextFollowUpDate,
        assignedTo,
        updatedBy: req.user._id, // Ensure you have this field in your schema for tracking purposes
        updatedAt: Date.now(),
      },
      { new: true, session }
    );

    if (!updatedFollowUp) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Follow-up not found" });
    }

    const newActivity = new LeadActivity({
      leadId: updatedFollowUp.leadId,
      userId: req.user._id,
      action: "status_change",
      details: `Updated follow-up on ${new Date(followUpDate).toLocaleDateString("en-US")}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const savedActivity = await newActivity.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      followUp: updatedFollowUp,
      activity: savedActivity,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

// Delete a follow-up
exports.deleteFollowUp = async (req, res) => {
  try {
    const { followUpId } = req.params;

    // Find and delete the follow-up
    const deletedFollowUp = await LeadFollowUp.findByIdAndDelete(followUpId);

    if (!deletedFollowUp) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json({ message: "Follow-up deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single follow-up by ID
exports.getFollowUpById = async (req, res) => {
  try {
    const { followUpId } = req.params;

    // Fetch the follow-up by its ID
    const followUp = await LeadFollowUp.findById(followUpId).populate(
      "assignedTo",
      "name email"
    );

    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json(followUp);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
