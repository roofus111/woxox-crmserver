const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const User = require("../models/User");
const Sales = require("../models/sales");
const Campaign = require("../models/Campaign");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const LeadActivity = require("../models/LeadActivity");

// Get all leads belonging to the user's company
exports.getAllLeads = async (req, res) => {
  try {
    console.log(req.user);

    // Retrieve the 'page' and 'limit' from the request query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the 'skip' value
    const skip = (page - 1) * limit;

    // Query to find leads with pagination
    const leads = await Lead.find({ company: req.user.company })
      .populate("assignedTo", "_id firstName lastName")
      .skip(skip)
      .limit(limit);

    // Optionally, you can return the total count of leads to help with pagination on the frontend
    const totalCount = await Lead.countDocuments({ company: req.user.company });

    res.status(200).json({
      leads: leads,
      totalLeads: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const leadId = req.params.id; // Get the ID from the request parameters

    // Fetch the lead from the database
    const lead = await Lead.findById(leadId)
      .populate("assignedTo", "firstName lastName email")
      .populate("campaignid"); // Populate the 'assignedTo' field if needed

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(lead);
  } catch (err) {
    console.error("Error fetching lead by ID:", err);
    res.status(500).json({ message: "Failed to retrieve lead" });
  }
};

exports.searchLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      assignedTo,
      status,
      campaign,
    } = req.query;
    const regex = new RegExp(search, "i");
    const searchCriteria = {
      $or: [
        { name: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
        // Add more fields as necessary
      ],
      company: req.user.company, // Assuming each lead is tied to a company from the user's context
    };
    // Add filters for assignedTo and status if provided
    if (assignedTo) {
      searchCriteria.assignedTo = assignedTo; // assuming assignedTo is an ID
    }

    if (campaign && campaign != "undefined") {
      {
        mongoose.Types.ObjectId.isValid(campaign)
          ? (searchCriteria.campaignid = campaign)
          : (searchCriteria.campaign = campaign);
      }
    }

    if (req.user.role == "user") {
      searchCriteria.assignedTo = req.user._id;
    }
    if (req.user.role == "unassigned") {
      searchCriteria.unassignedTo = null;
    }

    if (status) {
      searchCriteria.status = status; // assuming status is a string (e.g., "active", "inactive")
    }
    const leads = await Lead.find(searchCriteria)
      .populate("assignedTo", "_id firstName lastName")
      .populate("campaignid")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.status(200).json({
      leads: leads,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.AssignLeadEqual = async (req, res) => {
  try {
    // Fetch all users
    const { campaignid } = req.params;
    const users = req.body;

    if (users.length === 0) throw new Error("No users found");

    // Fetch all unassigned leads
    const unassignedLeads = await Lead.find({
      company: req.user.company,
      assignedTo: null,
      campaignid: campaignid,
    });
    if (unassignedLeads.length === 0)
      throw new Error("No unassigned leads found");

    // Distribute leads equally among users
    const totalUsers = users.length;
    let userIndex = 0;

    for (let lead of unassignedLeads) {
      lead.assignedTo = users[userIndex]._id;
      await lead.save();
      userIndex = (userIndex + 1) % totalUsers;
    }

    res
      .status(201)
      .json(
        `${unassignedLeads.length} Unassigned Leads are Assigned to ${users.length} Users Equally`
      );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to handle errors
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.AssignUserToLead = async (req, res) => {
  const { leadId, userId } = req.params;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const creator = await User.findById(req.user._id);
    console.log(creator);
    if (!creator) {
      return res.status(404).json({ message: "creator not found" });
    }
    // Find the lead and update it
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { assignedTo: user._id },
      { new: true } // Return the updated object and run validation
    ).populate("assignedTo", "_id firstName lastName");

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    // Create an activity log for this assignment
    const activity = new LeadActivity({
      leadId: leadId,
      user: userId,
      company: req.user.company._id,
      details: `Lead is assigned to ${user.firstName} ${user.lastName} by ${creator.name} `, // Assigned by is the person making the assignment
      action: "assigned",
      timestamp: new Date(),
      ipAddress: req.ip, // Capture the IP address from the request object
      userAgent: req.get("User-Agent"),
    });

    // Save the activity log to the database
    await activity.save();
    res.status(200).json(updatedLead);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error assigning user to lead", error: error.message });
  }
};
// Update Lead by ID controller
exports.UpdateLead = async (req, res) => {
  try {
    const leadId = req.params.id; // Lead ID from the request parameters
    const updateData = req.body; // Data from the request body to update the lead

    // Find the lead by ID and update it
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: {
          name: updateData.fullName, // Update lead name if provided
          email: updateData.email, // Update lead email if provided
          phone: updateData.phone, // Update lead phone if provided
          campaign: updateData.campaign, // Update campaign if provided
          status: updateData.status, // Update status if provided
          source: updateData.source, // Update source if provided
          company: updateData.company, // Update company reference if provided
          assignedTo: updateData.assignedTo, // Update assigned user if provided
          // Update the nested profile schema fields
          profile: {
            age: updateData.age,
            address: updateData.address,
            pinCode: updateData.pinCode,
            state: updateData.state,
            city: updateData.city,
            country: updateData.country,
            sslcJoinYear: updateData.sslcJoinYear,
            sslcPassOutYear: updateData.sslcPassOutYear,
            sslcScore: updateData.sslcScore,
            hscJoinYear: updateData.hscJoinYear,
            hscPassOutYear: updateData.hscPassOutYear,
            hscScore: updateData.hscScore,
            UGJoinYear: updateData.UGJoinYear,
            UGPassOutYear: updateData.UGPassOutYear,
            UG_CGPA: updateData.UG_CGPA,
            PGJoinYear: updateData.PGJoinYear,
            PGPassOutYear: updateData.PGPassOutYear,
            PG_CGPA: updateData.PG_CGPA,
            ieltsScore: updateData.ieltsScore,
            pteToeflScore: updateData.pteToeflScore,
            germanScore: updateData.germanScore,
            xiiEnglishScore: updateData.xiiEnglishScore,
            careerGapFrom: updateData.careerGapFrom,
            careerGapTo: updateData.careerGapTo,
            experienceFrom: updateData.experienceFrom,
            experienceTo: updateData.experienceTo,
            backlogs: updateData.backlogs,
            targetIntake: updateData.targetIntake,
            programOfInterest: updateData.programOfInterest,
            countryOfInterest: updateData.countryOfInterest,
            visaRefusal: updateData.visaRefusal,
            tuitionFeePreference: updateData.tuitionFeePreference,
          },
        },
      },
      { new: true, runValidators: true } // Return the updated document and run schema validation
    );

    // If lead is not found, return a 404 error
    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Send the updated lead data as a response
    res.status(200).json(updatedLead);
  } catch (error) {
    // Handle any errors that occur during the update
    res.status(500).json({ message: "Error updating lead", error });
  }
};

exports.UpdateLeadStages = async (req, res) => {
  const { leadId } = req.params; // Lead ID from request parameters
  const { stages } = req.body; // New status from request body
  console.log(req.body);

  try {
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { stages },
      { new: true } // Return the updated document
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({
      message: "Lead status updated successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating lead status",
      error: error.message,
    });
  }
};

exports.getLeadsForDocs = async (req, res) => {
  try {
    const leads = await Lead.find({
      company: req.user.company,
      status: "Pending",
    })
      .populate("assignedTo", "_id firstName lastName")
      .limit(100);

    res.status(200).json({
      leads: leads,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.getCampaigns = async (req, res) => {
//   try {
//     const campaignNames = await Lead.distinct("campaign", {
//       company: req.user.company,
//       assignedTo: req.user._id,
//     });
//     const campaignid = await Lead.distinct("campaignid", {
//       company: req.user.company,
//       assignedTo: req.user._id,
//     });
//     const leads = await Campaign.find({ _id: { $in: campaignid } });
//     const merged = [
//       ...campaignNames, // Include string IDs from camp1
//       ...leads, // Extract 'id' from each object in camp2
//     ];
//     res.status(200).json({
//       campaign: merged,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getCampaigns = async (req, res) => {
//   try {
//     // Get all campaigns from the Campaign collection
//     const campaigns = await Campaign.find({company: req.user.company._id});

//     // Get lead counts for all campaigns
//     const leadCounts = await Lead.aggregate([
//       {
//         $group: {
//           _id: "$campaignid",
//           totalLeads: { $sum: 1 }, // Count all leads
//           newLeads: {
//             $sum: { $cond: [{ $eq: ["$status", "New"] }, 1, 0] }, // Count only 'New' leads
//           },
//         },
//       },
//     ]);

//     // Merge campaign details with lead counts
//     const mergedCampaigns = campaigns.map(campaign => {
//       const leadData = leadCounts.find(lc => lc._id?.toString() === campaign._id.toString()) || {
//         totalLeads: 0,
//         newLeads: 0,
//       };

//       return {
//         id: campaign._id,
//         name: campaign.name,
//         totalLeads: leadData.totalLeads,
//         newLeads: leadData.newLeads,
//         details: campaign, // Include all campaign details
//       };
//     });

//     res.status(200).json({ campaign: mergedCampaigns });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


exports.getCampaigns = async (req, res) => {
  try {
    // Get all campaigns from the Campaign collection
    const campaignid = await Lead.distinct("campaignid", {
      company: req.user.company,
      assignedTo: req.user._id,
    });
    // Get lead counts for all campaigns
       const campaigns = await Campaign.find({ _id: { $in: campaignid } });

    const leadCounts = await Lead.aggregate([
      {
        $match: {
          campaignid: { $in: campaigns.map(c => c._id) }, // Filter by assigned campaigns
          assignedTo: new mongoose.Types.ObjectId(req.user._id), // Use assignedTo instead of user
        },
      },
      {
        $group: {
          _id: "$campaignid",
          totalLeads: { $sum: 1 }, // Count all leads
          newLeads: {
            $sum: { $cond: [{ $eq: ["$status", "New"] }, 1, 0] }, // Count only 'New' leads
          },
        },
      },
    ]);

    // Merge campaigns with their respective lead statistics
    const mergedCampaigns = campaigns.map(campaign => {
      const leadData = leadCounts.find(lc => lc._id?.toString() === campaign._id.toString()) || {
        totalLeads: 0,
        newLeads: 0,
      };
      return {
        id: campaign._id,
        name: campaign.name,
        totalLeads: leadData.totalLeads,
        newLeads: leadData.newLeads,
        details: campaign, // Include full campaign details
      };
    });

    res.status(200).json({ campaign: mergedCampaigns });
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.getCounsellorLeads = async (req, res) => {
  try {
    console.log(req.user);

    // Retrieve the 'page' and 'limit' from the request query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the 'skip' value
    const skip = (page - 1) * limit;

    // Query to find leads with pagination
    const leads = await Lead.find({
      company: req.user.company,
      campaign: req.params.campaign,
      assignedTo: req.user._id,
    })
      .populate("assignedTo", "_id firstName lastName")
      .populate("campaignid")
      .skip(skip)
      .limit(limit);

    // Optionally, you can return the total count of leads to help with pagination on the frontend
    const totalCount = await Lead.countDocuments({ company: req.user.company });

    res.status(200).json({
      leads: leads,
      totalLeads: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLeadsByCompany = async (req, res) => {
  // const { companyId } = req.params; // Assuming company ID is passed as a URL parameter

  try {
    // Deleting all leads where the 'company' field matches the companyId provided
    const result = await Lead.deleteMany({
      campaignid: "67b6d0aec6512b0cce2164d5",
    });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No leads found for the specified company." });
    }
    res
      .status(200)
      .json({ message: `Successfully deleted ${result.deletedCount} leads.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params; // Lead ID from request parameters
    const updates = req.body; // Fields to update from request body

    // Fetch the current lead from the database
    const existingLead = await Lead.findById(id);
    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check if any of the monitored fields are being updated
    const fieldsToCheck = ["followUp", "notes", "status"];
    const isCriticalFieldUpdated = fieldsToCheck.some(
      (field) => updates[field] !== undefined
    );

    // Prevent reverting untouched back to true
    if (updates.untouched === true) {
      return res
        .status(400)
        .json({
          message:
            'The "untouched" field cannot be reverted to true once set to false.',
        });
    }

    // Prepare update object
    const updateData = { ...updates };
    if (isCriticalFieldUpdated && existingLead.untouched) {
      updateData.untouched = false; // Set untouched to false if it's still true
    }

    // Update the lead
    const updatedLead = await Lead.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validators are applied
    });

    res
      .status(200)
      .json({ message: "Lead updated successfully", lead: updatedLead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Unassign leads untouched for more than 30 days.

exports.unassignUntouchedLeadsAfter30Days = async (req, res) => {
  try {
    // Calculate the time 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`Unassigning leads untouched since: ${thirtyDaysAgo}`);

    // Find leads that are untouched, assigned, and created more than 30 days ago
    const leadsToUnassign = await Lead.find({
      untouched: true, // Must be marked as untouched
      assignedTo: { $ne: null }, // Must have an assigned user
      updatedAt: { $lte: thirtyDaysAgo }, // Created more than 30 days ago
    });

    console.log(`Found ${leadsToUnassign.length} leads to unassign.`);

    if (leadsToUnassign.length === 0) {
      return res
        ? res.status(200).json({ message: "No leads to unassign." })
        : console.log("No leads to unassign.");
    }

    // Perform the update to unassign these leads
    const result = await Lead.updateMany(
      {
        untouched: true,
        assignedTo: { $ne: null },
        updatedAt: { $lte: thirtyDaysAgo },
      },
      { $set: { assignedTo: null } } // Set assignedTo to null
    );

    console.log(`Successfully unassigned ${result.modifiedCount} leads.`);

    // Optional response for manual triggers
    if (res) {
      return res.status(200).json({
        message: `${result.modifiedCount} leads were unassigned.`,
        leadsUpdated: result.modifiedCount,
      });
    }
  } catch (error) {
    console.error("Error while unassigning leads:", error.message);

    if (res) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
};

exports.AssignMultipleLeadsToUser = async (req, res) => {
  const { userId } = req.params;
  const { leadIds } = req.body; // Expect an array of lead IDs in the request body

  try {
    // Validate input
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No lead IDs provided or invalid format." });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update all leads in the list
    const updatedLeads = await Lead.updateMany(
      { _id: { $in: leadIds } }, // Match all leads with IDs in the list
      { assignedTo: user._id }, // Assign the user ID
      { new: true, runValidators: true } // Ensure validation and return updated docs
    );

    // Check if any leads were updated
    if (updatedLeads.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No leads found with the provided IDs." });
    }

    // Fetch the updated leads with populated user data
    const populatedLeads = await Lead.find({ _id: { $in: leadIds } }).populate(
      "assignedTo",
      "_id firstName lastName"
    );

    res.status(200).json({
      message: `${updatedLeads.matchedCount} leads successfully assigned.`,
      leads: populatedLeads,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error assigning leads to user.",
        error: error.message,
      });
  }
};

exports.createLead = async (req, res) => {
  const { name, phone, email, campaignid, district, assignedTo } = req.body; // Extract relevant fields from the request

  // Validate required fields
  if (!name || !phone || !campaignid) {
    return res
      .status(400)
      .json({ message: "Name, phone, and campaign ID are required." });
  }

  try {
    // Verify if the campaign ID exists
    const campaignExists = await Campaign.findById(campaignid);
    if (!campaignExists) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    // Check for duplicates based on phone or email
    const existingLead = await Lead.findOne({
      campaignid, // Include the campaign ID as a filter
      $or: [{ phone }],
    });

    if (existingLead) {
      return res
        .status(409)
        .json({
          message: "Lead with the same phone number or email already exists.",
        });
    }

    // Check if customer already exists based on phone or email
    let customerId = null;
    const existingCustomer = await Customer.findOne({
      $or: [{ phone }],
    });

    if (existingCustomer) {
      customerId = existingCustomer._id; // Store the found customerId
    }

    // Create a new lead
    const lead = new Lead({
      name,
      district,
      phone,
      email,
      assignedTo: assignedTo || null,
      campaignid: campaignid, // Associate lead with the campaign ID
      Customer: customerId, // Associate the lead with the existing customer (if found)
      company: req.user.company._id, // Associate with the user's company
    });

    const newLead = await lead.save(); // Save the lead in the database
    res.status(201).json(newLead); // Send the saved lead as a response
  } catch (err) {
    console.error("Error creating lead:", err.message);
    res
      .status(500)
      .json({ message: "Failed to create lead. Please try again later." });
  }
};

exports.getLeadsByCampaignId = async (req, res) => {
  const { campaignid } = req.params;
  const { page = 1, limit = 100, sort = 'createdAt', order = -1 } = req.query;

  try {
    // Validate campaignId
    if (!mongoose.Types.ObjectId.isValid(campaignid)) {
      return res.status(400).json({ error: "Invalid campaign ID format." });
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create sort object
    const sortObj = { [sort]: parseInt(order) };

    // Execute queries in parallel for better performance
    const [leads, totalCount] = await Promise.all([
      Lead.find({ campaignid })
        .select('-__v') // Exclude unnecessary fields
        .populate("assignedTo", "_id firstName lastName")
        .populate("campaignid", "_id name description")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean() // Convert to plain JavaScript objects for better performance
        .exec(),
      Lead.countDocuments({ campaignid })
    ]);

    // Check if leads exist
    if (!leads || leads.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No leads found for the given campaign ID." 
      });
    }

    // Return the paginated results with metadata
    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: parseInt(page),
          perPage: parseInt(limit),
          hasMore: skip + leads.length < totalCount
        }
      }
    });

  } catch (error) {
    console.error("Error fetching leads by campaign ID:", error.message);
    res.status(500).json({ 
      success: false,
      error: "An error occurred while fetching leads." 
    });
  }
};


exports.getworkflowLeads = async (req, res) => {
  const { Pipeline } = req.params;

  try {
    // Validate campaignId
    if (!mongoose.Types.ObjectId.isValid(Pipeline)) {
      return res.status(400).json({ error: "Invalid Pipeline ID format." });
    }

    // Fetch leads from the database
    const campaign = await Campaign.find({ Pipeline })

    // Check if leads exist
    if (!campaign || campaign.length === 0) {
      return res
        .status(404)
        .json({ message: "No campaign found for the given Pipeline ID." });
    }
    let leads = await Promise.all(
      campaign.map(async (item) => {
        return await Lead.find({ campaignid: item._id,status:"Converted" })
        .populate("assignedTo", "_id firstName lastName")
        .populate("campaignid", "_id name description")
        .exec();
      })
    );
    
    // Flatten the leads array if needed
    leads = leads.flat();

    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching leads by campaign ID:", error.message);
    res.status(500).json({ error: "An error occurred while fetching leads." });
  }
};
exports.UpdateLeadStatus = async (req, res) => {
  const { leadId } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "New",
    "Contacted",
    "Interested",
    "Not Interested",
    "Converted",
    "Pending",
    "In Progress",
    "Lost",
    "Won",
    "Duplicate",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const company = await Company.findById(req.user.company._id); // Fetch the company details
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (status === "Converted") {
      // if (!lead.Customer) {
      //   // Create a new customer
      //   // const newCustomer = new Customer({
      //   //   firstName: lead.name,
      //   //   phone: lead.phone,
      //   //   email: lead.email,
      //   //   company: req.user.company._id,
      //   // });

      //   const savedCustomer = await newCustomer.save();
      //   lead.Customer = savedCustomer._id;
      // }

      // Only create a sales request if financeModule is enabled
      if (company.Module.finance) {
        const year = new Date().getFullYear().toString().slice(-2);
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31);

        const salesCount =
          (await Sales.countDocuments({
            company: req.user.company._id,
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          })) + 1;

        const salesId = `${year}-${salesCount.toString().padStart(5, "0")}`;
        const newSales = new Sales({
          SalesId: salesId,
          LeadId: lead._id,
          company: req.user.company._id,
        });
        await newSales.save();
      }  
      lead.stages = 0;
    }

    lead.status = status;
  
    await lead.save();

    return res.status(200).json({
      message: "Lead status updated successfully",
      lead,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.addNoteToLead = async (req, res) => {
  const { leadId } = req.params; // Assuming leadId is passed as a URL parameter
  const { author, content } = req.body; // Note details from the request body

  try {
    // Update the lead by adding a note
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { $push: { notes: { author, content } } }, // Push the new note into the notes array
      { new: true } // Return the updated document
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res
      .status(200)
      .json({ message: "Note added successfully", lead: updatedLead });
  } catch (error) {
    console.error("Error adding note:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
exports.deleteNoteFromLead = async (req, res) => {
  const { leadId, noteId } = req.body; // Assuming leadId and noteId are passed as URL parameters

  try {
    // Find the lead and remove the note from the notes array
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { $pull: { notes: { _id: noteId } } }, // Pull the note with the specified noteId from the notes array
      { new: true } // Return the updated document
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check if the note was actually removed
    const noteRemoved = updatedLead.notes.some(
      (note) => note._id.toString() === noteId
    );

    if (noteRemoved) {
      return res.status(404).json({ message: "Note not found" });
    }

    return res
      .status(200)
      .json({ message: "Note deleted successfully", lead: updatedLead });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.homeInsight = async (req, res) => {
  try {
    const { assigneeId } = req.params; // Get assignee ID from request params
    const companyId = req.user?.company?._id; // Get company ID from req.user

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
      return res.status(400).json({ error: "Invalid Assignee ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Invalid company information" });
    }

    // Possible statuses (include all enum values)
    const possibleStatuses = [
      "New",
      "Contacted",
      "Interested",
      "Not Interested",
      "Converted",
      "Pending",
      "In Progress",
      "Lost",
      "Won",
    ];

    // Aggregation pipeline to group leads by status and count them
    const leadCounts = await Lead.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(assigneeId), // Use 'new' to instantiate ObjectId
          company: new mongoose.Types.ObjectId(companyId), // Use 'new' for company ID
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } }, // Group by status and count
    ]);

    // Transform the result: Populate all possible statuses with zero counts if missing
    const result = possibleStatuses.reduce((acc, status) => {
      acc[status] = leadCounts.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});

    // Respond with success
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getLeadCountByStatus:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getLeadsCountByCampaignAndStatus = async (req, res) => {
  try {
    const company = req.user.company._id; // Ensure this is correct

    // Build the filter object to apply in the $match stage
    let matchCondition = {};
    if (company) {
      matchCondition.company = new mongoose.Types.ObjectId(company); // Convert to ObjectId if needed
    }

    console.log("Match Condition:", matchCondition);
    // Aggregate to group leads by campaign and their status
    const leadsCount = await Lead.aggregate([
      {
        $match: matchCondition, // Filter by company if applicable
      },
      {
        $group: {
          _id: "$campaignid", // Group by the 'campaign' field
          totalLeads: { $sum: 1 }, // Count the total number of leads in each campaign
          unassigned: {
            $sum: { $cond: [{ $eq: ["$assignedTo", null] }, 1, 0] }, // Count unassigned leads
          },
          new: {
            $sum: { $cond: [{ $eq: ["$status", "New"] }, 1, 0] }, // Count 'New' leads
          },
          contacted: {
            $sum: { $cond: [{ $eq: ["$status", "Contacted"] }, 1, 0] }, // Count 'Contacted' leads
          },
          Converted: {
            $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] }, // Count 'Converted' leads
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] }, // Count 'In Progress' leads
          },
          Interested: {
            $sum: { $cond: [{ $eq: ["$status", "Interested"] }, 1, 0] }, // Count 'Interested' leads
          },
          won: {
            $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] }, // Count 'Won' leads
          },
          lost: {
            $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] }, // Count 'Lost' leads
          },
        },
      },
      {
        $project: {
          campaignid: "$_id", // Rename '_id' to 'campaign'
          totalLeads: 1, // Include the total leads count
          unassigned: 1, // Include the unassigned leads count
          new: 1, // Include the new leads count
          contacted: 1, // Include the contacted leads count
          Converted: 1,
          inProgress: 1,
          Interested: 1, // Include the in progress leads count
          won: 1, // Include the won leads count
          lost: 1, // Include the lost leads count
          _id: 0, // Exclude the default '_id' field
        },
      },
    ]);

    // Respond with the aggregated data
    return res.status(200).json({ success: true, data: leadsCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.userPerformance = async (req, res) => {
  try {
    const  companyId  = req.user.company;
    const { startDate, endDate } = req.query;

    // Create date filters
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    console.log(req.user.company);

    // Aggregate pipeline to get user performance metrics
    const userPerformance = await Lead.aggregate([
      {
        $match: {
          company: companyId,
          assignedTo: { $ne: null },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          userId: '$_id',
          name: '$userDetails.name',
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$convertedLeads', '$totalLeads'] },
              100
            ]
          }
        }
      },
      {
        $sort: { conversionRate: -1 }
      }
    ]);

    res.json({
      success: true,
      data: userPerformance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user performance data',
      error: error.message
    });
  }
};

exports.getLeadStatus = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ensure the end date includes the full day

        // Ensure user and company exist in the request
        if (!req.user || !req.user.company || !req.user._id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const companyId = req.user.company._id;
        const userId = req.user._id;

        // Base query for filtering leads by user and company
        const baseQuery = { company: companyId, assignedTo: userId };

        // Query for leads within date range
        const dateRangeQuery = { 
            ...baseQuery, 
            createdAt: { $gte: start, $lte: end } 
        };

        // Fetch lead counts within the date range
        const totalLeadsInRange = await Lead.countDocuments(dateRangeQuery);
        const newLeadsInRange = await Lead.countDocuments({ ...dateRangeQuery, status: 'New' });
        const inProgressLeadsInRange = await Lead.countDocuments({ ...dateRangeQuery, status: 'In Progress' });
        const convertedLeadsInRange = await Lead.countDocuments({ ...dateRangeQuery, status: 'Converted' });

        // Fetch overall lead counts
        const totalLeadsOverall = await Lead.countDocuments(baseQuery);
        const newLeadsOverall = await Lead.countDocuments({ ...baseQuery, status: 'New' });
        const inProgressLeadsOverall = await Lead.countDocuments({ ...baseQuery, status: 'In Progress' });
        const convertedLeadsOverall = await Lead.countDocuments({ ...baseQuery, status: 'Converted' });

        return res.status(200).json({
            dateRange: {
                totalLeads: totalLeadsInRange,
                newLeads: newLeadsInRange,
                inProgressLeads: inProgressLeadsInRange,
                convertedLeads: convertedLeadsInRange
            },
            overall: {
                totalLeads: totalLeadsOverall,
                newLeads: newLeadsOverall,
                inProgressLeads: inProgressLeadsOverall,
                convertedLeads: convertedLeadsOverall
            }
        });

    } catch (error) {
        console.error("Error fetching lead statistics:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};





