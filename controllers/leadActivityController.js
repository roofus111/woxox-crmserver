const LeadActivity = require('../models/LeadActivity'); // Assuming the model is in the models folder

const User = require('../models/User');
// Controller to create a new lead activity log
exports.createLeadActivity = async (req, res) => {
  const { leadId, action, details } = req.body;
console.log(action)
  try {
    // Create the activity log
    const newActivity = new LeadActivity({
      leadId,
      userId: req.user._id, // Assuming user is authenticated and user ID is available in req.user
      action,
      details,
      ipAddress: req.ip, // Getting IP address from request
      userAgent: req.headers['user-agent'], // Getting user-agent from request headers
    });

    const savedActivity = await newActivity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lead activity', error });
  }
};

// Controller to get all activities for a specific lead
exports.getLeadActivities = async (req, res) => {
  const { leadId } = req.params;

  try {
    const activities = await LeadActivity.find({ leadId })
      .populate('userId', 'name email') // Populating user details for clarity
      .sort({ timestamp: -1 }); // Sort by most recent activity
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lead activities', error });
  }
};

// Controller to get activities with optional filters (by user or action)
exports.getFilteredLeadActivities = async (req, res) => {
  const { leadId } = req.params;
  const { userId, action } = req.query;

  let filter = { leadId };

  if (userId) filter.userId = userId; // Filter by userId if provided
  if (action) filter.action = action; // Filter by action if provided

  try {
    const activities = await LeadActivity.find(filter)
      .populate('userId', 'name email') // Populate user information
      .sort({ timestamp: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching filtered lead activities', error });
  }
};

// Controller to delete all activities for a specific lead (optional)
exports.deleteLeadActivities = async (req, res) => {
  const { leadId } = req.params;

  try {
    await LeadActivity.deleteMany({ leadId });
    res.status(200).json({ message: 'Lead activities deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lead activities', error });
  }
};


// Controller to get LeadActivity with populated companyId
exports.getLeadActivityInsight = async (req, res) => {
  try {
console.log("njn vannu");

    // const { companyId } = req.user.company._id; // Assuming companyId is passed as a URL parameter
    
    // // Find activities for the company (assuming you can relate activities to company via userId)
    // const activities = await LeadActivity.find({ 'userId.company': companyId })
    //   .populate({
    //     path: 'userId',
    //     select: 'name email', // Populate userId with fields like name and email
    //   })
    //   .sort({ timestamp: -1 }); // Sort by most recent activity
    
    // if (!activities) {
    //   return res.status(404).json({ message: 'No activities found for this company' });
    // }

    res.status(200).json({message:"hello"});  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

