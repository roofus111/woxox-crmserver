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

// Controller to get all activities for a specific lead
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

exports.getActivityLogsByDate = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      assignedTo, 
      action, 
      sort = '-timestamp',
      page = 1,
      limit = 50
    } = req.query;

    if (!req.user || !req.user.company || !req.user.company._id) {
      return res.status(403).json({ message: 'Unauthorized: Invalid company information in token' });
    }

    const companyId = req.user.company._id;
    
    // Build the query filter
    const filter = { company: companyId };
    
    // Date filters
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        // Add one day to endDate and subtract 1 millisecond to include the entire day
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setMilliseconds(nextDay.getMilliseconds() - 1);
        filter.timestamp.$lte = nextDay;
      }
    }
    
    // User filter (assignedTo)
    if (assignedTo) {
      filter.userId = assignedTo;
    }
    
    // Action filter
    if (action) {
      filter.action = action;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Query the database for activities
    const activities = await LeadActivity.find(filter)
      .populate('userId', 'name email')
      .populate('leadId', 'name status')
      .populate({
        path: 'leadId', // Populate the leadId field
        populate: { path: 'tags', select: 'name color' } // Populate tags within the Lead model
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get the total count for pagination metadata
    const totalActivities = await LeadActivity.countDocuments(filter);

    // Group activities by date
    const groupedByDate = activities.reduce((acc, activity) => {
      const date = moment(activity.timestamp).format('YYYY-MM-DD');
      
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push(activity);
      return acc;
    }, {});

    // Format the response
    const formattedResponse = Object.keys(groupedByDate).map(date => ({
      date,
      activities: groupedByDate[date]
    })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    // Send the response
    res.status(200).json({
      totalActivities,
      totalPages: Math.ceil(totalActivities / parseInt(limit)),
      currentPage: parseInt(page),
      groupedActivities: formattedResponse
    });
    
  } catch (error) {
    console.error('Error fetching grouped activity logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getActivityKPIs = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const companyId = req.user.company._id;

    // Build date filter
    const dateFilter = {
      company: companyId,
      timestamp: {}
    };
    
    if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setMilliseconds(nextDay.getMilliseconds() - 1);
      dateFilter.timestamp.$lte = nextDay;
    }
    
    if (userId) dateFilter.userId = userId;

    // Get all activities within the date range
    const activities = await LeadActivity.find(dateFilter)
      .populate('userId', 'name email')
      .populate('leadId', 'name status tags')
      .sort('timestamp');

    // Group activities by date and then by user
    const dailyActivities = activities.reduce((acc, activity) => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      const userId = activity.userId._id.toString();
      const userName = activity.userId.name;
      const userEmail = activity.userId.email;

      if (!acc[date]) {
        acc[date] = {
          date,
          users: {}
        };
      }

      if (!acc[date].users[userId]) {
        acc[date].users[userId] = {
          userInfo: {
            id: userId,
            name: userName,
            email: userEmail
          },
          summary: {
            totalActivities: 0,
            firstActivity: null,
            lastActivity: null,
            actionBreakdown: {},
            leadsInteracted: new Set(),
            callMetrics: {
              total: 0,
              answered: 0,
              notAnswered: 0,
              busy: 0,
              wrongNumber: 0,
              notReachable: 0,
              callbackRequested: 0
            }
          },
          timeline: []
        };
      }

      const userDayData = acc[date].users[userId];
      
      // Update summary
      userDayData.summary.totalActivities++;
      if (!userDayData.summary.firstActivity) {
        userDayData.summary.firstActivity = activity.timestamp;
      }
      userDayData.summary.lastActivity = activity.timestamp;
      
      // Track action breakdown
      userDayData.summary.actionBreakdown[activity.action] = 
        (userDayData.summary.actionBreakdown[activity.action] || 0) + 1;
      
      // Track unique leads
      userDayData.summary.leadsInteracted.add(activity.leadId._id.toString());

      // Update call metrics
      if (['Answered', 'NotAnswered', 'Busy', 'Wrong Number', 'Not Reachable', 'Callback Requested']
          .includes(activity.action)) {
        userDayData.summary.callMetrics.total++;
        switch (activity.action) {
          case 'Answered': userDayData.summary.callMetrics.answered++; break;
          case 'NotAnswered': userDayData.summary.callMetrics.notAnswered++; break;
          case 'Busy': userDayData.summary.callMetrics.busy++; break;
          case 'Wrong Number': userDayData.summary.callMetrics.wrongNumber++; break;
          case 'Not Reachable': userDayData.summary.callMetrics.notReachable++; break;
          case 'Callback Requested': userDayData.summary.callMetrics.callbackRequested++; break;
        }
      }

      // Add to timeline
      userDayData.timeline.push({
        timestamp: activity.timestamp,
        action: activity.action,
        details: activity.details,
        lead: {
          id: activity.leadId._id,
          name: activity.leadId.name,
          status: activity.leadId.status,
          tags: activity.leadId.tags
        }
      });

      return acc;
    }, {});

    // Format the final response
    const formattedResponse = Object.entries(dailyActivities).map(([date, dayData]) => ({
      date,
      users: Object.values(dayData.users).map(userData => ({
        ...userData,
        summary: {
          ...userData.summary,
          leadsInteracted: userData.summary.leadsInteracted.size, // Convert Set to count
          activeHours: (new Date(userData.summary.lastActivity) - new Date(userData.summary.firstActivity)) / (1000 * 60 * 60),
          timeline: userData.timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        }
      }))
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      dailyActivities: formattedResponse
    });

  } catch (error) {
    console.error('Error generating activity insights:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.company._id;

    // Build date filter
    const dateFilter = {
      company: companyId,
      timestamp: {}
    };
    
    if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setMilliseconds(nextDay.getMilliseconds() - 1);
      dateFilter.timestamp.$lte = nextDay;
    }

    // Get all activities within the date range with proper population
    const activities = await LeadActivity.find(dateFilter)
      .populate({
        path: 'userId',
        select: 'name email',
        match: { _id: { $exists: true } }  // Ensure user exists
      })
      .populate({
        path: 'leadId',
        select: 'name status',
        match: { _id: { $exists: true } }  // Ensure lead exists
      })
      .sort('timestamp');

    // Filter out activities with missing user or lead data
    const validActivities = activities.filter(activity => 
      activity.userId && activity.leadId && 
      activity.userId._id && activity.leadId._id
    );

    // Group activities by user
    const userStats = validActivities.reduce((acc, activity) => {
      // Skip if required data is missing
      if (!activity.userId?._id || !activity.leadId?._id) {
        return acc;
      }

      const userId = activity.userId._id.toString();
      
      if (!acc[userId]) {
        acc[userId] = {
          user: {
            id: userId,
            name: activity.userId.name || 'Unknown User',
            email: activity.userId.email || 'No Email'
          },
          metrics: {
            totalInteractions: 0,
            uniqueLeads: new Set(),
            convertedLeads: new Set(),
            interestedLeads: new Set(),
            callMetrics: {
              total: 0,
              answered: 0,
              successRate: 0
            },
            actionBreakdown: {}
          }
        };
      }

      const userMetrics = acc[userId].metrics;
      userMetrics.totalInteractions++;
      userMetrics.uniqueLeads.add(activity.leadId._id.toString());

      // Track action types
      userMetrics.actionBreakdown[activity.action] = 
        (userMetrics.actionBreakdown[activity.action] || 0) + 1;

      // Track call metrics
      if (['Answered', 'NotAnswered', 'Busy', 'Wrong Number', 'Not Reachable', 'Callback Requested']
          .includes(activity.action)) {
        userMetrics.callMetrics.total++;
        if (activity.action === 'Answered') {
          userMetrics.callMetrics.answered++;
        }
      }

      // Track lead status (with null check)
      if (activity.leadId.status === 'converted') {
        userMetrics.convertedLeads.add(activity.leadId._id.toString());
      }
      if (activity.leadId.status === 'interested') {
        userMetrics.interestedLeads.add(activity.leadId._id.toString());
      }

      return acc;
    }, {});

    // Calculate final metrics and create leaderboard
    const leaderboard = Object.values(userStats).map(userData => ({
      user: userData.user,
      metrics: {
        ...userData.metrics,
        uniqueLeads: userData.metrics.uniqueLeads.size,
        convertedLeads: userData.metrics.convertedLeads.size,
        interestedLeads: userData.metrics.interestedLeads.size,
        callMetrics: {
          ...userData.metrics.callMetrics,
          successRate: (userData.metrics.callMetrics.answered / 
            (userData.metrics.callMetrics.total || 1)) * 100
        },
        conversionRate: (userData.metrics.convertedLeads.size / 
          userData.metrics.uniqueLeads.size) * 100,
        interestRate: (userData.metrics.interestedLeads.size / 
          userData.metrics.uniqueLeads.size) * 100,
        averageInteractionsPerLead: userData.metrics.totalInteractions / 
          (userData.metrics.uniqueLeads.size || 1)
      }
    }));

    // Calculate rankings for different categories (only if there are entries)
    const rankings = leaderboard.length > 0 ? {
      byTotalInteractions: [...leaderboard].sort((a, b) => 
        b.metrics.totalInteractions - a.metrics.totalInteractions),
      byUniqueLeads: [...leaderboard].sort((a, b) => 
        b.metrics.uniqueLeads - a.metrics.uniqueLeads),
      byConvertedLeads: [...leaderboard].sort((a, b) => 
        b.metrics.convertedLeads - a.metrics.convertedLeads),
      byConversionRate: [...leaderboard].sort((a, b) => 
        b.metrics.conversionRate - a.metrics.conversionRate),
      byCallSuccessRate: [...leaderboard].sort((a, b) => 
        b.metrics.callMetrics.successRate - a.metrics.callMetrics.successRate)
    } : {
      byTotalInteractions: [],
      byUniqueLeads: [],
      byConvertedLeads: [],
      byConversionRate: [],
      byCallSuccessRate: []
    };

    // Calculate team totals
    const teamTotals = leaderboard.reduce((totals, userData) => ({
      totalInteractions: totals.totalInteractions + userData.metrics.totalInteractions,
      uniqueLeads: totals.uniqueLeads + userData.metrics.uniqueLeads,
      convertedLeads: totals.convertedLeads + userData.metrics.convertedLeads,
      interestedLeads: totals.interestedLeads + userData.metrics.interestedLeads,
      totalCalls: totals.totalCalls + userData.metrics.callMetrics.total,
      answeredCalls: totals.answeredCalls + userData.metrics.callMetrics.answered
    }), {
      totalInteractions: 0,
      uniqueLeads: 0,
      convertedLeads: 0,
      interestedLeads: 0,
      totalCalls: 0,
      answeredCalls: 0
    });

    res.status(200).json({
      rankings,
      teamTotals: {
        ...teamTotals,
        averageConversionRate: teamTotals.uniqueLeads ? 
          (teamTotals.convertedLeads / teamTotals.uniqueLeads) * 100 : 0,
        averageCallSuccessRate: teamTotals.totalCalls ? 
          (teamTotals.answeredCalls / teamTotals.totalCalls) * 100 : 0
      },
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Error generating leaderboard:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};










