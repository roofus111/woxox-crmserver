const { RestoreObjectCommand } = require("@aws-sdk/client-s3");
const LeadFollowUp = require("../models/followUp"); // Import the LeadFollowUp model
const Lead = require("../models/Lead"); // Assuming you have a Lead model
const LeadActivity = require("../models/LeadActivity"); // Assuming the model is in the models folder

function resolveCompanyId(user) {
  return user?.company?._id || user?.company || null;
}

function resolveAssigneeId(assignedTo, fallbackUserId) {
  if (assignedTo == null) return fallbackUserId;
  const trimmed = String(assignedTo).trim();
  return trimmed ? trimmed : fallbackUserId;
}

// Standalone Mongo (no replica set) cannot use multi-doc transactions.
exports.createFollowUp = async (req, res) => {
  try {
    const {
      leadId,
      followUpDate,
      status,
      notes,
      nextFollowUpDate,
      assignedTo,
      transferLeadOwnership = true,
    } = req.body;

    if (!leadId || !followUpDate || !status) {
      return res.status(400).json({ message: "Missing required fields", required: ["leadId", "followUpDate", "status"] });
    }

    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(403).json({ message: "Company profile is missing. Log out and sign in again." });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const assigneeId = resolveAssigneeId(assignedTo, req.user._id);
    const scheduledAt = nextFollowUpDate || followUpDate;

    const newFollowUp = new LeadFollowUp({
      company: companyId,
      leadId,
      followUpDate: scheduledAt,
      status,
      notes,
      nextFollowUpDate: scheduledAt,
      assignedTo: assigneeId,
      createdBy: req.user._id,
    });

    const savedFollowUp = await newFollowUp.save();

    // When scheduling for a manager/teammate, hand the lead to them so they own follow-through
    const shouldTransferLead =
      transferLeadOwnership !== false &&
      assignedTo &&
      String(assigneeId) !== String(req.user._id) &&
      String(lead.assignedTo || '') !== String(assigneeId);

    if (shouldTransferLead) {
      try {
        const User = require("../models/User");
        const assigneeUser = await User.findById(assigneeId).select("firstName lastName name");
        const previousAssignee = lead.assignedTo;
        lead.assignedTo = assigneeId;
        if (previousAssignee) lead.reshared = true;
        await lead.save();

        await LeadActivity.create({
          leadId,
          company: companyId,
          userId: req.user._id,
          action: "assigned",
          details: `Lead handed to ${assigneeUser?.firstName || ""} ${assigneeUser?.lastName || assigneeUser?.name || "assignee"} via follow-up schedule`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: { followUpId: savedFollowUp._id, reason: "follow_up_handoff" },
        });
      } catch (assignErr) {
        console.warn("Follow-up lead handoff failed:", assignErr.message);
      }
    }

    let savedActivity = null;
    try {
      const newActivity = new LeadActivity({
        leadId,
        company: companyId,
        userId: req.user._id,
        action: "followUp",
        details: `Created a new follow-up on ${scheduledAt}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: { followUpId: savedFollowUp._id, assignedTo: assigneeId },
      });
      savedActivity = await newActivity.save();
    } catch (activityErr) {
      console.warn("Follow-up activity log failed:", activityErr.message);
    }

    res.status(201).json({
      followUp: savedFollowUp,
      activity: savedActivity,
      leadTransferred: Boolean(shouldTransferLead),
    });

    if (String(assigneeId) !== String(req.user._id)) {
      try {
        const { notifyUser } = require("../utils/notifyUser");
        await notifyUser({
          companyId,
          recipientId: assigneeId,
          senderId: req.user._id,
          type: shouldTransferLead ? "lead_assigned" : "follow_up_reminder",
          title: shouldTransferLead ? "Lead assigned to you" : "New follow-up assigned",
          message: shouldTransferLead
            ? (notes || `A lead was handed to you with a scheduled follow-up`)
            : (notes || `A follow-up was scheduled for you`),
          relatedEntity: shouldTransferLead
            ? { entityType: "Lead", entityId: leadId }
            : { entityType: "FollowUp", entityId: savedFollowUp._id },
          priority: "medium",
          metadata: { leadId, followUpId: savedFollowUp._id },
        });
      } catch (notifyErr) {
        console.warn("Follow-up create notify failed:", notifyErr.message);
      }
    }
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllfollowUps = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    let searchCriteria = { company: companyId };
    if (req.user.role == "user") {
      searchCriteria = { assignedTo: req.user._id, company: companyId };
    }

    const followUp = await LeadFollowUp.find(searchCriteria)
      .populate("leadId")
      .populate("assignedTo", "name firstName lastName")
      .populate("createdBy", "name firstName lastName");
    res.status(200).json(followUp || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getMyfollowUps = async (req, res) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const searchCriteria = { assignedTo: req.user._id, company: companyId };

    const followUp = await LeadFollowUp.find(searchCriteria)
      .populate("leadId")
      .populate("assignedTo", "name firstName lastName")
      .populate("createdBy", "name firstName lastName")
      .populate({
        path: "leadId",
        populate: { path: "tags", select: "name color" },
      });
    res.status(200).json(followUp || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all follow-ups for a specific lead
exports.getFollowUpsByLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const companyId = req.user.company?._id || req.user.company;

    const followUps = await LeadFollowUp.find({
      leadId,
      ...(companyId ? { company: companyId } : {}),
    })
      .populate("assignedTo", "name email firstName lastName")
      .populate("createdBy", "name firstName lastName");

    // Empty list is valid — return [] so lead UI can show an empty state
    return res.status(200).json(followUps || []);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateFollowUp = async (req, res) => {
  try {
    const { followUpId } = req.params;
    const { followUpDate, status, notes, nextFollowUpDate, assignedTo, completionNote } = req.body;

    if (!followUpId) {
      return res.status(400).json({ message: "Follow-up ID is required." });
    }

    const followUp = await LeadFollowUp.findById(followUpId);
    if (!followUp) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    const originalNextFollowUpDate = followUp.nextFollowUpDate;
    const companyId = resolveCompanyId(req.user);

    if (followUpDate) followUp.followUpDate = followUpDate;
    if (status) followUp.status = status;
    if (notes) followUp.notes = notes;
    if (assignedTo) followUp.assignedTo = assignedTo;
    if (completionNote) followUp.completionNote = completionNote;

    if (nextFollowUpDate) {
      followUp.nextFollowUpDate = nextFollowUpDate;
      followUp.updatedAt = Date.now();
    }

    followUp.updatedBy = req.user._id;

    const updatedFollowUp = await followUp.save();

    if (companyId) {
      try {
        await LeadActivity.create({
          leadId: updatedFollowUp.leadId,
          company: companyId,
          userId: req.user._id,
          action: "followUp",
          details: `Updated follow-up on ${new Date(followUpDate || updatedFollowUp.followUpDate).toLocaleDateString("en-IN")}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        if (nextFollowUpDate && nextFollowUpDate !== originalNextFollowUpDate?.toISOString()) {
          await LeadActivity.create({
            leadId: updatedFollowUp.leadId,
            company: companyId,
            userId: req.user._id,
            action: "Rescheduled",
            details: `Rescheduled to  ${new Date(nextFollowUpDate).toLocaleDateString("en-IN")}`,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
          });
        }
      } catch (activityErr) {
        console.warn("Follow-up update activity log failed:", activityErr.message);
      }
    }

    res.status(200).json({
      message: "Follow-up updated successfully.",
      followUp: updatedFollowUp
    });
  } catch (error) {
    console.error("Error updating follow-up:", error.message);
    res.status(500).json({
      message: "An error occurred while updating the follow-up.",
      error: error.message,
    });
  }
};

//delete a follow up
exports.deleteFollowUp = async (req, res) => {
  try {
    const { followUpId } = req.params;

    if (!followUpId) {
      return res.status(400).json({ message: "Follow-up ID is required." });
    }

    const deletedFollowUp = await LeadFollowUp.findByIdAndDelete(followUpId);

    if (!deletedFollowUp) {
      return res.status(404).json({ message: "Follow-up not found." });
    }

    const companyId = resolveCompanyId(req.user);
    let newActivity = null;
    if (companyId) {
      try {
        newActivity = await LeadActivity.create({
          leadId: deletedFollowUp.leadId,
          userId: req.user._id,
          company: companyId,
          action: "deleted",
          details: `Deleted follow-up scheduled on ${new Date(deletedFollowUp.followUpDate).toLocaleDateString("en-IN")}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      } catch (activityErr) {
        console.warn("Follow-up delete activity log failed:", activityErr.message);
      }
    }

    res.status(200).json({
      message: "Follow-up deleted successfully.",
      activity: newActivity,
    });
  } catch (error) {
    console.error("Error deleting follow-up:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
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



exports.createWoxiFollowUp = async (req, res) => {
  try {
    const {
      leadId,
      followUpDate,
      status,
      notes,
      nextFollowUpDate,
      assignedTo,
      company
    } = req.body;

    if (!leadId || !followUpDate || !status) {
      return res.status(400).json({ 
        message: "Required fields missing", 
        required: ['leadId', 'followUpDate', 'status'] 
      });
    }

    if (!Date.parse(followUpDate) || (nextFollowUpDate && !Date.parse(nextFollowUpDate))) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const companyId = company || resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(403).json({ message: "Company profile is missing" });
    }

    const newFollowUp = new LeadFollowUp({
      company: companyId,
      leadId,
      followUpDate: new Date(followUpDate),
      status,
      notes,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      assignedTo: resolveAssigneeId(assignedTo, req.user._id),
      createdBy: req.user._id,
      bot: true
    });

    const savedFollowUp = await newFollowUp.save();

    let savedActivity = null;
    try {
      savedActivity = await LeadActivity.create({
        leadId,
        company: companyId,
        userId: req.user._id,
        action: "followUp",
        details: `Woxi created a new follow-up scheduled for ${new Date(followUpDate).toLocaleDateString("en-IN")}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (activityErr) {
      console.warn("Woxi follow-up activity log failed:", activityErr.message);
    }

    res.status(201).json({
      message: "Follow-up created successfully",
      followUp: savedFollowUp,
      activity: savedActivity,
    });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({ 
      message: "Failed to create follow-up", 
      error: error.message 
    });
  }
};