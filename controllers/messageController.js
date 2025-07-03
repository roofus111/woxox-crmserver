const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

const messageController = {
    // Get messages between two users with pagination
    async getMessages(req, res) {
        try {
            const { userId, withUserId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const messages = await Message.getMessageHistory(userId, withUserId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.status(200).json({
                success: true,
                data: messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch messages",
                message: error.message
            });
        }
    },

    // Get a single message by ID
    async getMessage(req, res) {
        try {
            const message = await Message.findById(req.params.messageId)
                .populate('from', 'name avatar')
                .populate('to', 'name avatar');

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            res.status(200).json({
                success: true,
                data: message
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch message",
                message: error.message
            });
        }
    },

    // Delete a message (soft delete)
    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            const { userId } = req.body;

            const message = await Message.findById(messageId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            if (message.from.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    error: "Not authorized to delete this message"
                });
            }

            await message.softDelete(userId);

            res.status(200).json({
                success: true,
                message: "Message deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to delete message",
                message: error.message
            });
        }
    },

    // Update message content
    async updateMessage(req, res) {
        try {
            const { messageId } = req.params;
            const { userId, newContent } = req.body;

            const message = await Message.findById(messageId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            if (message.from.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    error: "Not authorized to edit this message"
                });
            }

            const editData = {
                content: message.content,
                editedAt: new Date(),
                editedBy: userId
            };

            const updatedMessage = await Message.findByIdAndUpdate(
                messageId,
                {
                    content: newContent,
                    edited: true,
                    $push: { editHistory: editData },
                    updatedAt: new Date()
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                data: updatedMessage
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to update message",
                message: error.message
            });
        }
    },

    // Add reaction to message
    async addReaction(req, res) {
        try {
            const { messageId } = req.params;
            const { userId, emoji } = req.body;

            const message = await Message.findById(messageId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            await message.addReaction(userId, emoji);

            res.status(200).json({
                success: true,
                data: {
                    messageId,
                    reactions: message.reactions,
                    reactionCounts: message.reactionCounts
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to add reaction",
                message: error.message
            });
        }
    },

    // Mark message as read
    async markAsRead(req, res) {
        try {
            const { messageId } = req.params;
            const { userId } = req.body;

            const message = await Message.findById(messageId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            await message.markAsRead(userId);

            res.status(200).json({
                success: true,
                message: "Message marked as read"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to mark message as read",
                message: error.message
            });
        }
    },

    async getUsersWithLastMessageDetails(req, res) {
        try {
            const  userId  = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
          
            const conversations = await Message.aggregate([
                // Match messages involving the current user
                {
                    $match: {
                        $or: [
                            { from: new mongoose.Types.ObjectId(userId) },
                            { to: new mongoose.Types.ObjectId(userId) }
                        ],
                        deleted: { $ne: true }
                    }
                },
                // Sort by creation date descending
                {
                    $sort: { createdAt: -1 }
                },
                // Determine the other user in the conversation
                {
                    $addFields: {
                        otherUser: {
                            $cond: {
                                if: { $eq: ["$from", new mongoose.Types.ObjectId(userId)] },
                                then: "$to",
                                else: "$from"
                            }
                        }
                    }
                },
                // Group by conversation (other user)
                {
                    $group: {
                        _id: "$otherUser",
                        lastMessage: { $first: "$$ROOT" },
                        totalMessages: { $sum: 1 },
                        unreadCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ["$to", new mongoose.Types.ObjectId(userId)] },
                                            { $ne: ["$status", "read"] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                // Lookup other user's details
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                // Unwind user details
                {
                    $unwind: "$userDetails"
                },
                // Format the response
                {
                    $project: {
                        _id: 0,
                        userId: "$_id",
                        user: {
                            _id: "$userDetails._id",
                            name: "$userDetails.name",
                            avatar: "$userDetails.avatar",
                            status: "$userDetails.status",
                            lastSeen: "$userDetails.lastSeen"
                        },
                        lastMessage: {
                            _id: "$lastMessage._id",
                            content: "$lastMessage.content",
                            messageType: "$lastMessage.messageType",
                            fileUrl: "$lastMessage.fileUrl",
                            fileName: "$lastMessage.fileName",
                            status: "$lastMessage.status",
                            createdAt: "$lastMessage.createdAt",
                            edited: "$lastMessage.edited",
                            reactions: "$lastMessage.reactions",
                            from: "$lastMessage.from",
                            to: "$lastMessage.to"
                        },
                        conversationStats: {
                            totalMessages: "$totalMessages",
                            unreadCount: "$unreadCount",
                            lastActivity: "$lastMessage.createdAt"
                        }
                    }
                },
                // Sort by last message date
                {
                    $sort: { "lastMessage.createdAt": -1 }
                },
                // Pagination
                {
                    $skip: skip
                },
                {
                    $limit: parseInt(limit)
                }
            ]);
            console.log(conversations);
            // Get total count for pagination
            const totalCount = await Message.aggregate([
                {
                    $match: {
                        $or: [
                            { from: new mongoose.Types.ObjectId(userId) },
                            { to: new mongoose.Types.ObjectId(userId) }
                        ],
                        deleted: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: {
                            $cond: {
                                if: { $eq: ["$from", new mongoose.Types.ObjectId(userId)] },
                                then: "$to",
                                else: "$from"
                            }
                        }
                    }
                },
                {
                    $count: "total"
                }
            ]);

            // Process conversations to add online status and format dates
            const processedConversations = conversations.map(conv => ({                ...conv,
                user: {
                    ...conv.user,
                    isOnline: conv.user.status === 'online',
                    lastSeen: conv.user.lastSeen ? new Date(conv.user.lastSeen).toISOString() : null
                },
                lastMessage: {
                    ...conv.lastMessage,
                    createdAt: new Date(conv.lastMessage.createdAt).toISOString(),
                    isOwnMessage: conv.lastMessage.from.toString() === userId,
                    preview: getMessagePreview(conv.lastMessage)
                }
            }));

            res.status(200).json({
                success: true,
                data: {
                    conversations: processedConversations,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil((totalCount[0]?.total || 0) / parseInt(limit)),
                        totalConversations: totalCount[0]?.total || 0,
                        hasMore: processedConversations.length === parseInt(limit)
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: "Failed to fetch conversations",
                message: error.message
            });
        }
    }
};

// Helper function to generate message preview based on message type
function getMessagePreview(message) {
    switch (message.messageType) {
        case 'text':
            return message.content.length > 50 
                ? `${message.content.substring(0, 47)}...` 
                : message.content;
        case 'image':
            return '📷 Image';
        case 'video':
            return '🎥 Video';
        case 'audio':
            return '🎵 Audio message';
        case 'file':
            return `📎 ${message.fileName || 'File'}`;
        case 'location':
            return '📍 Location';
        case 'sticker':
            return '😊 Sticker';
        default:
            return 'Message';
    }
}

module.exports = messageController;
