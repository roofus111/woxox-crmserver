const Lead = require("../models/Lead");
const User = require("../models/User");

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

exports.searchLeads = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = "", assignedTo, status } = req.query;
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

// Create a new lead
exports.createLead = async (req, res) => {
  const lead = new Lead({
    ...req.body,
    company: req.user.company._id,
  });

  try {
    const newLead = await lead.save();
    res.status(201).json(newLead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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

exports.UpdateLeadStatus = async (req, res) => {
  const { leadId } = req.params; // Lead ID from request parameters
  const { status } = req.body; // New status from request body
  console.log(req.body);
  // Validate status value
  // const validStatuses = ["New", "Contacted", "Qualified", "Lost", "Won"];
  // if (!validStatuses.includes(status)) {
  //   return res.status(400).json({ message: "Invalid status value" });
  // }

  try {
    // Find the lead by ID and update the status
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { status },
      { new: true } // Return the updated document
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if( lead.status === "Converted"){
      console.log('Push it to Finance');
      
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