const { RestoreObjectCommand } = require("@aws-sdk/client-s3");
const LeadFollowUp = require("../models/followUp"); // Import the LeadFollowUp model
const Lead = require("../models/Lead"); // Assuming you have a Lead model
const LeadActivity = require("../models/LeadActivity"); // Assuming the model is in the models folder
const mongoose = require("mongoose");

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
      company: req.user.company._id,
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
exports.getMyfollowUps = async (req, res) => {
  try {
    let searchCriteria = {}
    searchCriteria = { assignedTo : req.user._id, company: req.user.company}
   
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

exports.updateFollowUp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { followUpId } = req.params;
    const { followUpDate, status, notes, nextFollowUpDate, assignedTo } = req.body;

    if (!followUpId) {
      throw new Error("Follow-up ID is required.");
    }

    // Find the follow-up
    const followUp = await LeadFollowUp.findById(followUpId).session(session);
    if (!followUp) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Follow-up not found" });
    }

    // Store original nextFollowUpDate for comparison
    const originalNextFollowUpDate = followUp.nextFollowUpDate;

    // Update fields only if provided
    if (followUpDate) followUp.followUpDate = followUpDate;
    if (status) followUp.status = status;
    if (notes) followUp.notes = notes;
    if (assignedTo) followUp.assignedTo = assignedTo;

    // Handle nextFollowUpDate updates explicitly
    if (nextFollowUpDate) {
      followUp.nextFollowUpDate = nextFollowUpDate;
      followUp.updatedAt = Date.now(); // Always update the timestamp
    }

    followUp.updatedBy = req.user._id;

    // Save the updates
    const updatedFollowUp = await followUp.save({ session });

    // Log general update activity
    const generalActivity = new LeadActivity({
      leadId: updatedFollowUp.leadId,
      company: req.user.company._id,
      userId: req.user._id,
      action: "assigned",
      details: `Updated follow-up on ${new Date(followUpDate || updatedFollowUp.followUpDate).toLocaleDateString("en-IN")}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await generalActivity.save({ session });

    // Log specific next follow-up date activity, if changed
    if (nextFollowUpDate && nextFollowUpDate !== originalNextFollowUpDate?.toISOString()) {
      const nextFollowUpActivity = new LeadActivity({
        leadId: updatedFollowUp.leadId,
        company: req.user.company._id,
        userId: req.user._id,
        action: "Rescheduled",
        details: `Rescheduled to  ${new Date(nextFollowUpDate).toLocaleDateString("en-IN")}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      await nextFollowUpActivity.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Follow-up updated successfully.",
      followUp: updatedFollowUp
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating follow-up:", error.message);
    res.status(500).json({
      message: "An error occurred while updating the follow-up.",
      error: error.message,
    });
  }
};

//delete a follow up
exports.deleteFollowUp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { followUpId } = req.params;

    if (!followUpId) {
      throw new Error("Follow-up ID is required.");
    }

    // Find and delete the follow-up
    const deletedFollowUp = await LeadFollowUp.findByIdAndDelete(followUpId, { session });

    if (!deletedFollowUp) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Follow-up not found." });
    }

    // Create a new activity log for the deletion
    const newActivity = new LeadActivity({
      leadId: deletedFollowUp.leadId,
      userId: req.user._id,
      company: req.user.company._id,
      action: "deleted",
      details: `Deleted follow-up scheduled on ${new Date(deletedFollowUp.followUpDate).toLocaleDateString("en-IN")}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await newActivity.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    res.status(200).json({
      message: "Follow-up deleted successfully.",
      activity: newActivity,
    });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    // End the session
    session.endSession();
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

//Bug Resolver
exports.deleteLeadFollowUpsWithNoLeadId = async (req, res) => {
  try {
    const result = 123
    res.status(200).send({
      message: "Deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).send({
      message: "Error deleting records",
      error: error.message
    });
  }
};