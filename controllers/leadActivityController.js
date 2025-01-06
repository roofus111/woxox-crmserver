const LeadActivity = require('../models/LeadActivity'); // Assuming the model is in the models folder

const User = require('../models/User');
// Controller to create a new lead activity log
exports.createLeadActivity = async (req, res) => {
  const { leadId, action, details } = req.body;
  try {
    // Create the activity log
    const newActivity = new LeadActivity({
      leadId,
      userId: req.user._id, // Assuming user is authenticated and user ID is available in req.user
      company: req.user.company._id,
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

// // Controller to get all activities for a specific lead
exports.getLeadActivities = async (req, res) => {
  const { leadId } = req.params;

  try {
    const activities = await LeadActivity.find({ company: req.user.company._id,leadId })
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

  let filter = { leadId,company: req.user.company._id };

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
    await LeadActivity.deleteMany({ company: req.user.company._id,leadId });
    res.status(200).json({ message: 'Lead activities deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lead activities', error });
  }
};

const moment = require('moment'); // Ensure moment.js is installed

exports.getLeadActivitiesByCompany = async (req, res) => {
  try {
    const {  sort = '-timestamp', startDate, endDate } = req.query;

    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ message: 'Unauthorized: Invalid company information in token' });
    }

    const companyId = req.user.company._id;

    // Build the query filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate); // Start date filter
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate); // End date filter
    }

    const filter = { company: companyId };
    if (startDate || endDate) {
      filter.timestamp = dateFilter; // Add date filter to the query
    }

    // Query the database for activities
    const activities = await LeadActivity.find(filter)
      .populate('userId', 'name email') // Populating user details
      .populate('leadId', 'name status') // Populating lead details
      .sort(sort);

    // Get the total count for pagination metadata
    const totalActivities = await LeadActivity.countDocuments(filter);

    // Group activities by userId -> action -> date
    const groupedActivities = activities.reduce((acc, activity) => {
      const userId = activity.userId._id.toString();
      const userName = activity.userId.name;
      const userEmail = activity.userId.email;
      const action = activity.action;
      const date = moment(activity.timestamp).format('YYYY-MM-DD'); // Format timestamp to a date

      if (!acc[userId]) {
        acc[userId] = {
          user: { id: userId, name: userName, email: userEmail },
          actions: {},
        };
      }

      if (!acc[userId].actions[action]) {
        acc[userId].actions[action] = {};
      }

      if (!acc[userId].actions[action][date]) {
        acc[userId].actions[action][date] = [];
      }

      acc[userId].actions[action][date].push(activity);
      return acc;
    }, {});

    // Send the response
    res.status(200).json({
      totalActivities,
      groupedActivities: Object.values(groupedActivities),
    });
  } catch (error) {
    console.error('Error fetching lead activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};










