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
      .populate("createdBy",'name')
      .populate({
        path: 'leadId', // Populate the leadId field
        populate: { path: 'tags', select: 'name color' } // Populate tags within the Lead model
      });
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
  console.log(req.body);
  

  try {
    const { followUpId } = req.params;
    const { followUpDate, status, notes, nextFollowUpDate, assignedTo,completionNote } = req.body;

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
    if (completionNote) followUp.completionNote = completionNote;

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

exports.getRecentAndUpcomingFollowUps = async (req, res) => {
  try {
   
    
    const now = new Date();
    let searchCriteria = { company: req.user.company._id };
    
    // Add assignedTo criteria if user role is 'user'
    if (req.user.role === 'user') {
      searchCriteria.assignedTo = req.user._id;
    }

    // Get missed follow-ups (past 5 days)
    const missedFollowUps = await LeadFollowUp.find({
      ...searchCriteria,
      nextFollowUpDate: {
        $lt: now,
        $gte: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      status: { $ne: 'Completed' }
    })
    .sort({ followUpDate: -1 })
    .limit(5)
    .populate("leadId")
    .populate("assignedTo", 'name')
    .populate("createdBy", 'name')
    .populate({
      path: 'leadId',
      populate: { path: 'tags', select: 'name color' }
    });

    // Get upcoming follow-ups (next 5 days)
    const upcomingFollowUps = await LeadFollowUp.find({
      ...searchCriteria,
      nextFollowUpDate: {
        $gt: now,
        $lte: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days ahead
      }
    })
    .sort({ followUpDate: 1 })
    .limit(5)
    .populate("leadId")
    .populate("assignedTo", 'name')
    .populate("createdBy", 'name')
    .populate({
      path: 'leadId',
      populate: { path: 'tags', select: 'name color' }
    });

    // Additional counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count follow-ups assigned to me
    const assignedToMeCount = await LeadFollowUp.countDocuments({
      company: req.user.company._id,
      assignedTo: req.user._id,
      createdBy: { $ne: req.user._id },
      status: { $ne: 'Completed' }
    });

    // Count follow-ups created by me but assigned to others
    const createdByMeCount = await LeadFollowUp.countDocuments({
      company: req.user.company._id,
      createdBy: req.user._id,
      assignedTo: { $ne: req.user._id },
      status: { $ne: 'Completed' }
    });

    // Count total pending follow-ups
    const totalPendingCount = await LeadFollowUp.countDocuments({
      ...searchCriteria,
      status: { $ne: 'Completed' }
    });

    // Count today's follow-ups
    const todayFollowUpsCount = await LeadFollowUp.countDocuments({
      ...searchCriteria,
      nextFollowUpDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Count upcoming follow-ups (excluding today)
    const upcomingFollowUpsCount = await LeadFollowUp.countDocuments({
      ...searchCriteria,
      nextFollowUpDate: {
        $gt: tomorrow
      }
    });

    res.status(200).json({
      missed: missedFollowUps,
      upcoming: upcomingFollowUps,
      counts: {
        assignedToMe: assignedToMeCount,
        createdByMeForOthers: createdByMeCount,
        totalPending: totalPendingCount,
        today: todayFollowUpsCount,
        upcoming: upcomingFollowUpsCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getFilteredFollowUps = async (req, res) => {
  try {
    const { dateRange, filterType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    const companyId = req.user.company._id;

    // Set date range criteria
    const dateRangeCriteria = {};
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        dateRangeCriteria.followUpDate = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lt: new Date(now.setHours(23, 59, 59, 999))
        };
        break;
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateRangeCriteria.followUpDate = {
          $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          $lt: new Date(yesterday.setHours(23, 59, 59, 999))
        };
        break;
      }
      case 'thisWeek': {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateRangeCriteria.followUpDate = {
          $gte: new Date(firstDay.setHours(0, 0, 0, 0)),
          $lt: new Date(lastDay.setHours(23, 59, 59, 999))
        };
        break;
      }
      case 'lastWeek': {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay() - 7));
        const lastDay = new Date(now.setDate(now.getDate() - now.getDay() - 1));
        dateRangeCriteria.followUpDate = {
          $gte: new Date(firstDay.setHours(0, 0, 0, 0)),
          $lt: new Date(lastDay.setHours(23, 59, 59, 999))
        };
        break;
      }
      case 'thisMonth':
        dateRangeCriteria.followUpDate = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        };
        break;
      case 'lastMonth': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        dateRangeCriteria.followUpDate = {
          $gte: new Date(firstDay.setHours(0, 0, 0, 0)),
          $lt: new Date(lastDay.setHours(23, 59, 59, 999))
        };
        break;
      }
      case 'last30Days':
        dateRangeCriteria.followUpDate = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          $lt: new Date(now.setHours(23, 59, 59, 999))
        };
        break;
      case 'last90Days':
        dateRangeCriteria.followUpDate = {
          $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          $lt: new Date(now.setHours(23, 59, 59, 999))
        };
        break;
      case 'thisYear':
        dateRangeCriteria.followUpDate = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lt: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        };
        break; 
      case 'lastYear': {
        const lastYear = now.getFullYear() - 1;
        dateRangeCriteria.followUpDate = {
          $gte: new Date(lastYear, 0, 1),
          $lt: new Date(lastYear, 11, 31, 23, 59, 59, 999)
        };
        break;
      }
      case 'custom':
        if (startDate && endDate) {
          dateRangeCriteria.followUpDate = {
            $gte: new Date(startDate),
            $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          };
        }
        break;
      case 'upcoming7Days':
        dateRangeCriteria.followUpDate = {
          $gte: new Date(now),
          $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'overdue':
        dateRangeCriteria.followUpDate = {
          $lt: new Date(now.setHours(0, 0, 0, 0))
        };
        dateRangeCriteria.status = { $ne: 'Completed' };
        break;
    }

    // Set filter type criteria
    let filterCriteria = { company: companyId };
    switch (filterType) {
      case 'assignedToMe':
        filterCriteria = {
          ...filterCriteria,
          assignedTo: userId,
          createdBy: { $ne: userId }
        };
        break;
      case 'createdByMeForOthers':
        filterCriteria = {
          ...filterCriteria,
          createdBy: userId,
          assignedTo: { $ne: userId }
        };
        break;
      case 'createdByMeForMe':
        filterCriteria = {
          ...filterCriteria,
          createdBy: userId,
          assignedTo: userId
        };
        break;
    }

    // Combine date range and filter criteria
    const searchCriteria = {
      ...filterCriteria,
      ...dateRangeCriteria
    };

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get filtered follow-ups with pagination
    const followUps = await LeadFollowUp.find(searchCriteria)
      .sort({ followUpDate: dateRange === 'overdue' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("leadId")
      .populate("assignedTo", 'name')
      .populate("createdBy", 'name')
      .populate({
        path: 'leadId',
        populate: { path: 'tags', select: 'name color' }
      });

    // Get total count for pagination
    const totalCount = await LeadFollowUp.countDocuments(searchCriteria);

    // Get stats for pending follow-ups
    const pendingStats = {
      assignedToMe: await LeadFollowUp.countDocuments({
        company: companyId,
        assignedTo: userId,
        createdBy: { $ne: userId },
        status: 'Pending'
      }),
      createdByMeForOthers: await LeadFollowUp.countDocuments({
        company: companyId,
        createdBy: userId,
        assignedTo: { $ne: userId },
        status: 'Pending'
      }),
      createdByMeForMe: await LeadFollowUp.countDocuments({
        company: companyId,
        createdBy: userId,
        assignedTo: userId,
        status: 'Pending'
      })
    };

    res.status(200).json({
      followUps,
      stats: pendingStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        hasMore: skip + followUps.length < totalCount
      },
      dateRange: {
        filter: dateRange,
        startDate: dateRangeCriteria.followUpDate?.$gte,
        endDate: dateRangeCriteria.followUpDate?.$lt
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

