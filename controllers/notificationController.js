const Notification = require('../models/Notification');

exports.createNotification = async (req, res) => {
  try {
    const {
      recipient,
      sender,
      type,
      title,
      message,
      relatedEntity,
      priority,
      actionUrl,
      metadata
    } = req.body;

    // Set company from authenticated user
    const company = req.user.company._id;

    // Validate required fields
    if (!company || !recipient || !type || !title || !message || !relatedEntity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: company, recipient, type, title, message, and relatedEntity are required'
      });
    }

    // Validate notification type
    const validTypes = [
      'lead_assigned',
      'lead_status_change',
      'ticket_created',
      'ticket_updated',
      'ticket_assigned',
      'task_assigned',
      'task_due',
      'task_completed',
      'payment_received',
      'payment_due',
      'document_shared',
      'follow_up_reminder',
      'leave_request',
      'leave_approved',
      'leave_rejected',
      'expense_approved',
      'expense_rejected',
      'message_received',
      'event_reminder'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    // Validate related entity
    const validEntityTypes = ['Lead', 'Ticket', 'Task', 'Payment', 'Document', 'FollowUp', 'Leave', 'Expense', 'Message', 'Event'];
    if (!validEntityTypes.includes(relatedEntity.entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }

    // Create new notification
    const notification = new Notification({
      company,
      recipient,
      sender,
      type,
      title,
      message,
      relatedEntity,
      priority: priority || 'medium',
      actionUrl,
      metadata: metadata || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const {
      status,
      type,
      priority,
      page = 1,
      limit = 10,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {
      recipient: req.user._id,
      company: req.user.company._id
    };

    // Add optional filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'name email')
      .populate('recipient', 'name email');

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

exports.updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['unread', 'read', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: unread, read, archived'
      });
    }

    // First find the notification to check if it exists and get its current state
    const existingNotification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
      company: req.user.company._id
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to update it'
      });
    }

    // Prepare update object
    const updateData = { status };
    if (status === 'read' && !existingNotification.readAt) {
      updateData.readAt = new Date();
    }

    // Update the notification
    const notification = await Notification.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('sender', 'name email')
     .populate('recipient', 'name email');

    res.status(200).json({
      success: true,
      message: 'Notification status updated successfully',
      notification
    });

  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification status',
      error: error.message
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the notification
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
      company: req.user.company._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

