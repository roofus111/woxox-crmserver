const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const { uploadFileToS3 } = require('../utils/uploadFile');
const { getIO, getOnlineUserIds } = require('../socketServer');

const getCompanyId = (user) => {
    if (!user?.company) return null;
    if (typeof user.company === 'object' && user.company._id) {
        return user.company._id;
    }
    return user.company;
};

const messageController = {
    async getContacts(req, res) {
        try {
            const userId = req.user._id || req.user.id;
            const companyId = getCompanyId(req.user);

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    error: 'User has no company assigned'
                });
            }

            const users = await User.find({
                company: companyId,
                isActive: { $ne: false },
                _id: { $ne: userId }
            }).select('name firstName lastName role profileImage email phone');

            const onlineIds = new Set(getOnlineUserIds());

            const contacts = users.map(user => ({
                _id: user._id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                email: user.email,
                avatar: user.profileImage?.fileUrl || null,
                status: onlineIds.has(user._id.toString()) ? 'online' : 'offline'
            }));

            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch contacts',
                message: error.message
            });
        }
    },

    async getOnlineUsers(req, res) {
        try {
            const companyId = getCompanyId(req.user);
            if (!companyId) {
                return res.status(400).json({ success: false, error: 'User has no company assigned' });
            }

            const onlineIds = getOnlineUserIds();
            const companyUsers = await User.find({
                company: companyId,
                isActive: { $ne: false },
                _id: { $in: onlineIds }
            }).select('_id name');

            res.status(200).json({
                success: true,
                data: {
                    userIds: companyUsers.map(u => u._id.toString()),
                    users: companyUsers
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch online users',
                message: error.message
            });
        }
    },

    async sendMessage(req, res) {
        try {
            const from = req.user.id;
            const { to, content, messageType = 'text', fileUrl, fileName, fileSize, fileMimeType, replyTo, clientMessageId } = req.body;

            if (!to) {
                return res.status(400).json({ success: false, error: 'Recipient is required' });
            }

            const messageData = {
                from,
                to,
                content: content || fileName || '',
                messageType,
                clientMessageId,
                status: 'sent'
            };

            if (fileUrl) {
                Object.assign(messageData, { fileUrl, fileName, fileSize, fileMimeType });
            }
            if (replyTo) messageData.replyTo = replyTo;

            const newMessage = await new Message(messageData).save();
            await newMessage.populate('from', 'name avatar profileImage');
            await newMessage.populate('to', 'name avatar profileImage');

            const io = getIO();
            if (io) {
                io.to(to.toString()).emit('new_message', {
                    messageId: newMessage._id,
                    from: newMessage.from,
                    to: newMessage.to,
                    content: newMessage.content,
                    messageType: newMessage.messageType,
                    fileUrl: newMessage.fileUrl,
                    fileName: newMessage.fileName,
                    fileSize: newMessage.fileSize,
                    fileMimeType: newMessage.fileMimeType,
                    status: newMessage.status,
                    timestamp: newMessage.createdAt,
                    clientMessageId
                });
            }

            const recipient = await User.findById(to).select('socketId');
            if (recipient?.socketId) {
                await newMessage.markAsDelivered();
            }

            res.status(201).json({ success: true, data: newMessage });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to send message',
                message: error.message
            });
        }
    },

    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const fileUrl = await uploadFileToS3(req.file);
            const messageType = req.file.mimetype.startsWith('image/') ? 'image'
                : req.file.mimetype.startsWith('video/') ? 'video'
                : req.file.mimetype.startsWith('audio/') ? 'audio'
                : 'file';

            res.status(200).json({
                success: true,
                data: {
                    fileUrl,
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    fileMimeType: req.file.mimetype,
                    messageType
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to upload file',
                message: error.message
            });
        }
    },

    async markConversationRead(req, res) {
        try {
            const userId = req.user.id;
            const { withUserId } = req.params;

            const unreadMessages = await Message.find({
                from: withUserId,
                to: userId,
                status: { $ne: 'read' },
                deleted: { $ne: true }
            });

            const io = getIO();
            for (const message of unreadMessages) {
                await message.markAsRead(userId);
                if (io) {
                    io.to(message.from.toString()).emit('message_read', {
                        messageId: message._id,
                        readBy: userId,
                        readAt: new Date(),
                        status: 'read'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Conversation marked as read',
                count: unreadMessages.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to mark conversation as read',
                message: error.message
            });
        }
    },

    // Get messages between two users with pagination
    async getMessages(req, res) {
        try {
            const userId = req.user.id;
            const { withUserId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const messages = await Message.getMessageHistory(userId, withUserId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.status(200).json({
                success: true,
                data: messages.reverse(),
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
            const userId = req.user.id;

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
            const userId = req.user.id;
            const { newContent } = req.body;

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
            const userId = req.user.id;
            const { emoji } = req.body;

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
            const userId = req.user.id;

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
            const onlineIds = new Set(getOnlineUserIds());
            const processedConversations = conversations.map(conv => ({
                ...conv,
                user: {
                    ...conv.user,
                    isOnline: onlineIds.has(conv.user._id?.toString()),
                    status: onlineIds.has(conv.user._id?.toString()) ? 'online' : 'offline',
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
