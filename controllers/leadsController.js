const Lead = require('../models/Lead');
const User = require('../models/User')


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
                             .populate('assignedTo', '_id firstName lastName')
                             .skip(skip)
                             .limit(limit);

    // Optionally, you can return the total count of leads to help with pagination on the frontend
    const totalCount = await Lead.countDocuments({ company: req.user.company });

    res.status(200).json({
      leads: leads,
      totalLeads: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchLeads = async (req, res) => {
  console.log("HHHHHHHITTTTTT")
  try {
    // console.log(req.user);
    const { searchQuery} = req.query;
    const regex = new RegExp(searchQuery, 'i');
    const searchCriteria = {
      $or: [
        { name: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
        // Add more fields as necessary
      ],
      company: req.user.company // Assuming each lead is tied to a company from the user's context
    };

    const leads = await Lead.find(searchCriteria)
                             .populate('assignedTo', '_id firstName lastName')
    res.status(200).json({
      leads: leads
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new lead
exports.createLead = async (req, res) => {
  const lead = new Lead({
    ...req.body,
    company: req.user.company._id
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
    
    if (users.length === 0) throw new Error('No users found');

    // Fetch all unassigned leads
    const unassignedLeads = await Lead.find({ company: req.user.company, assignedTo: null });
    if (unassignedLeads.length === 0) throw new Error('No unassigned leads found');

    // Distribute leads equally among users
    const totalUsers = users.length;
    let userIndex = 0;

    for (let lead of unassignedLeads) {
      lead.assignedTo = users[userIndex]._id;
      await lead.save();
      userIndex = (userIndex + 1) % totalUsers;
    }

    res.status(201).json(`${unassignedLeads.length} Unassigned Leads are Assigned to ${users.length} Users Equally`);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
