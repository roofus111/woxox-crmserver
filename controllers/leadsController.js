
const mongoose = require('mongoose');
const Lead = require("../models/Lead");
const User = require("../models/User");
const Sales = require('../models/sales'); 
const Campaign = require("../models/Campaign")
const Customer = require("../models/Customer")


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
                           .populate("assignedTo", "firstName lastName email"); // Populate the 'assignedTo' field if needed

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(lead);
  } catch (err) {
    console.error("Error fetching lead by ID:", err);
    res.status(500).json({ message: 'Failed to retrieve lead' });
  }
};

exports.searchLeads = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = "", assignedTo, status ,campaign} = req.query;
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
    if (campaign && campaign != 'undefined') {
      searchCriteria.campaign = campaign ; // assuming assignedTo is an ID
    }

    if(req.user.role =='user'){
      searchCriteria.assignedTo = req.user._id;
    }
    if(req.user.role =='unassigned'){
      searchCriteria.unassignedTo = null;
    }

    if (status) {
      searchCriteria.status = status; // assuming status is a string (e.g., "active", "inactive")
    }
    const leads = await Lead.find(searchCriteria)
      .populate("assignedTo", "_id firstName lastName")
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

// // Create a new lead
// exports.createLead = async (req, res) => {
//   const lead = new Lead({
//     ...req.body,
//     company: req.user.company._id,
//   });

//   try {
//     const newLead = await lead.save();
//     res.status(201).json(newLead);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

exports.AssignLeadEqual = async (req, res) => {
  try {
    // Fetch all users
    const users = req.body;
    console.log(users);

    if (users.length === 0) throw new Error("No users found");

    // Fetch all unassigned leads
    const unassignedLeads = await Lead.find({
      company: req.user.company,
      assignedTo: null,
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

exports.UpdateLeadStatus = handleAsync(async (req, res) => {
  const { leadId } = req.params;
  const { status } = req.body;

  // Find the lead by ID and update the status
  const lead = await Lead.findByIdAndUpdate(leadId, { status }, { new: true });
  if (!lead) {
    return res.status(404).json({ message: "Lead not found" });
  }

  // If the status is converted, create a new sales entry
  if (status === "Converted") {
    const year = new Date().getFullYear().toString().slice(-2); // Get last two digits of the year

    // Count sales for the specific company in the current year
    const salesCount = await Sales.countDocuments({
      company: req.user.company._id, // Filter by company ID
      createdAt: {
        $gte: new Date(new Date().getFullYear(), 0, 1), // Start of the year
        $lte: new Date(new Date().getFullYear(), 11, 31), // End of the year
      },
    }) + 1;

    // Generate SalesId
    const salesId = `${year}-${salesCount.toString().padStart(5, '0')}`;

    // Create a new sales document
    const newSales = new Sales({
      SalesId: salesId,
      LeadId: lead._id,
      company: req.user.company._id, // Associate with the company
    });

    const savedSales = await newSales.save();
    console.log(savedSales);
  }

  // Respond with success message
  return res.status(200).json({
    message: "Lead status updated successfully",
    lead,
  });
});

exports.AssignUserToLead = async (req, res) => {
  const { leadId, userId } = req.params;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the lead and update it
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { assignedTo: user._id },
      { new: true } // Return the updated object and run validation
    ) .populate("assignedTo", "_id firstName lastName")

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning user to lead', error: error.message });
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
          name: updateData.fullName,  // Update lead name if provided
          email: updateData.email,  // Update lead email if provided
          phone: updateData.phone,  // Update lead phone if provided
          campaign: updateData.campaign,  // Update campaign if provided
          status: updateData.status,  // Update status if provided
          source: updateData.source,  // Update source if provided
          company: updateData.company,  // Update company reference if provided
          assignedTo: updateData.assignedTo,  // Update assigned user if provided
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
            tuitionFeePreference: updateData.tuitionFeePreference
          }
        }
      },
      { new: true, runValidators: true }  // Return the updated document and run schema validation
    );

    // If lead is not found, return a 404 error
    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Send the updated lead data as a response
    res.status(200).json(updatedLead);
  } catch (error) {
    // Handle any errors that occur during the update
    res.status(500).json({ message: 'Error updating lead', error });
  }
}


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
    const leads = await Lead.find({ company: req.user.company,status:'Pending' })
      .populate("assignedTo", "_id firstName lastName")
      .limit(100);

    res.status(200).json({
      leads: leads
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getCampaigns = async (req, res) => {
  try {
    const campaignNames = await Lead.distinct('campaign', { company: req.user.company, assignedTo:req.user._id});
    res.status(200).json({
      campaign: campaignNames
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    const leads = await Lead.find({ company: req.user.company,campaign:req.params.campaign,assignedTo:req.user._id })
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

exports.deleteLeadsByCompany = async (req, res) => {
  // const { companyId } = req.params; // Assuming company ID is passed as a URL parameter

  try {
    // Deleting all leads where the 'company' field matches the companyId provided
    const result = await Lead.deleteMany({ company: "66e1675aad0e5a07675470f8" });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No leads found for the specified company." });
    }
    res.status(200).json({ message: `Successfully deleted ${result.deletedCount} leads.` });
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
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check if any of the monitored fields are being updated
    const fieldsToCheck = ['followUp', 'notes', 'status'];
    const isCriticalFieldUpdated = fieldsToCheck.some((field) => updates[field] !== undefined);

    // Prevent reverting untouched back to true
    if (updates.untouched === true) {
      return res.status(400).json({ message: 'The "untouched" field cannot be reverted to true once set to false.' });
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

    res.status(200).json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
        ? res.status(200).json({ message: 'No leads to unassign.' })
        : console.log('No leads to unassign.');
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
    console.error('Error while unassigning leads:', error.message);

    if (res) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};
exports.AssignMultipleLeadsToUser = async (req, res) => {
  const { userId } = req.params;
  const { leadIds } = req.body; // Expect an array of lead IDs in the request body

  try {
    // Validate input
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: "No lead IDs provided or invalid format." });
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
      return res.status(404).json({ message: "No leads found with the provided IDs." });
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
    res.status(500).json({ message: "Error assigning leads to user.", error: error.message });
  }
};


exports.createLead = async (req, res) => {
  const { name, phone, email, campaignid } = req.body; // Extract relevant fields from the request
console.log(campaignid);

  // Validate required fields
  if (!name || !phone || !campaignid) {
    return res.status(400).json({ message: "Name, phone, and campaign ID are required." });
  }

  try {
    // Verify if the campaign ID exists
    const campaignExists = await Campaign.findById(campaignid);
    if (!campaignExists) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    // Check for duplicates based on phone or email
    const existingLead = await Lead.findOne({
      $or: [{ phone }, { email }],
    });

    if (existingLead) {
      return res.status(409).json({ message: "Lead with the same phone number or email already exists." });
    }

    // Check if customer already exists based on phone or email
    let customerId = null;
    const existingCustomer = await Customer.findOne({
      $or: [{ phone }, { email }],
    });

    if (existingCustomer) {
      customerId = existingCustomer._id; // Store the found customerId
    }

    // Create a new lead
    const lead = new Lead({
      name,
      phone,
      email,
      campaignid: campaignid, // Associate lead with the campaign ID
      Customer: customerId, // Associate the lead with the existing customer (if found)
      company: req.user.company._id, // Associate with the user's company
    });

    const newLead = await lead.save(); // Save the lead in the database
    res.status(201).json(newLead); // Send the saved lead as a response
  } catch (err) {
    console.error("Error creating lead:", err.message);
    res.status(500).json({ message: "Failed to create lead. Please try again later." });
  }
};
exports.AssignLeadsToUsersByCampaign = async (req, res) => {
  const { campaignid } = req.params;
  const { userAssignments } = req.body;  // Expecting an object { userId: [leadIds] }

  try {
    // Validate userAssignments
    if (!userAssignments || typeof userAssignments !== 'object') {
      return res.status(400).json({ message: "Invalid userAssignments format." });
    }

    // Check if the campaign exists
    const campaign = await Campaign.findById(campaignid);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }
    
    const userIds = Object.keys(userAssignments);
    
    // Check if users exist
    const users = await User.find({ '_id': { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ message: "Some users not found." });
    }

    // Flatten all leadIds from the assignments and check if they exist
    const allLeadIds = [].concat(...Object.values(userAssignments));
    const leads = await Lead.find({ '_id': { $in: allLeadIds }, campaignid: campaignid });
    if (leads.length !== allLeadIds.length) {
      return res.status(404).json({ message: "Some leads not found in the specified campaign." });
    }

    // Assign the leads to the respective users
    const updatePromises = [];

    for (const [userId, leadsid] of Object.entries(userAssignments)) {
      updatePromises.push(
        Lead.updateMany(
          { _id: { $in: leadsid }, campaignid: campaignid }, // Match leads in the given campaign
          { assignedTo: userId } // Assign to the current user
        )
      );
    }

    // Execute the update operations
    await Promise.all(updatePromises);

    // Optionally, you can fetch the updated leads with populated user data
    const updatedLeads = await Lead.find({ _id: { $in: allLeadIds } })
      .populate('assignedTo', '_id firstName lastName');

    res.status(200).json({
      message: `Leads successfully assigned to users.`,
      leads: updatedLeads,
    });
  } catch (error) {
    console.error(error);  // Log the error for debugging
    res.status(500).json({ message: "Error assigning leads to users.", error: error.message });
  }
};

exports.getLeadsByCampaignId = async (req, res) => {
  const { campaignid } = req.params;

  try {
    // Validate campaignId
    if (!mongoose.Types.ObjectId.isValid(campaignid)) {
      return res.status(400).json({ error: 'Invalid campaign ID format.' });
    }

    // Fetch leads from the database
    const leads = await Lead.find({ campaignid })
      .populate("assignedTo", "_id firstName lastName")
      .exec();

    // Check if leads exist
    if (!leads || leads.length === 0) {
      return res.status(404).json({ message: 'No leads found for the given campaign ID.' });
    }

    // Return the leads
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads by campaign ID:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching leads.' });
  }
};









