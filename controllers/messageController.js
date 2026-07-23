const Message = require('../models/Message');
const User = require('../models/User');
const ChatPreference = require('../models/ChatPreference');
const ChatGroup = require('../models/ChatGroup');
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
            const from = req.user._id || req.user.id;
            const {
                to,
                content,
                messageType = 'text',
                fileUrl,
                fileName,
                fileSize,
                fileMimeType,
                replyTo,
                clientMessageId,
                mentions = [],
                forwardedFrom,
            } = req.body;

            if (!to) {
                return res.status(400).json({ success: false, error: 'Recipient is required' });
            }
            if (!from) {
                return res.status(401).json({ success: false, error: 'Sender not authenticated' });
            }

            const blockPref = await ChatPreference.findOne({
                userId: to,
                peerId: from,
                peerType: 'user',
                blocked: true,
            }).catch(() => null);
            if (blockPref) {
                return res.status(403).json({ success: false, error: 'You are blocked by this user' });
            }

            const messageData = {
                from,
                to,
                content: content || fileName || '',
                messageType,
                clientMessageId,
                status: 'sent',
                mentions,
            };

            if (fileUrl) {
                Object.assign(messageData, { fileUrl, fileName, fileSize, fileMimeType });
            }
            if (replyTo) messageData.replyTo = replyTo;
            if (forwardedFrom) {
                messageData.forwardedFrom = forwardedFrom;
                messageData.forwardedBy = from;
                messageData.forwardedAt = new Date();
            }

            const newMessage = await new Message(messageData).save();
            await newMessage.populate('from', 'name avatar profileImage');
            await newMessage.populate('to', 'name avatar profileImage');
            if (replyTo) {
                await newMessage.populate('replyTo', 'content messageType fileName from');
            }
            if (mentions?.length) {
                await newMessage.populate('mentions', 'name');
            }

            const replyPayload = newMessage.replyTo
                ? {
                    _id: newMessage.replyTo._id || newMessage.replyTo,
                    content: newMessage.replyTo.content,
                    messageType: newMessage.replyTo.messageType,
                    fileName: newMessage.replyTo.fileName,
                }
                : null;

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
                    replyTo: replyPayload,
                    mentions: newMessage.mentions,
                    forwardedFrom: newMessage.forwardedFrom,
                    status: newMessage.status,
                    timestamp: newMessage.createdAt,
                    clientMessageId
                });
            }

            const recipient = await User.findById(to).select('socketId');
            if (recipient?.socketId) {
                await newMessage.markAsDelivered();
                if (io) {
                    io.to(from.toString()).emit('message_delivered', {
                        messageId: newMessage._id,
                        clientMessageId,
                        status: 'delivered',
                        deliveredAt: newMessage.deliveredAt,
                    });
                }
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
            console.error('Chat upload failed:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to upload file',
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
            const { page = 1, limit = 50, before } = req.query;
            const parsedLimit = parseInt(limit, 10);

            const query = {
                $or: [
                    { from: userId, to: withUserId },
                    { from: withUserId, to: userId }
                ],
                deleted: { $ne: true }
            };
            if (before) query.createdAt = { $lt: new Date(before) };

            const messages = await Message.find(query)
                .sort({ createdAt: -1 })
                .limit(parsedLimit)
                .populate('from', 'name avatar profileImage')
                .populate('to', 'name avatar profileImage')
                .populate('replyTo', 'content messageType fileName from')
                .populate('mentions', 'name')
                .populate('forwardedFrom', 'content messageType fileName from');

            res.status(200).json({
                success: true,
                data: messages.reverse(),
                pagination: {
                    page: parseInt(page, 10),
                    limit: parsedLimit,
                    hasMore: messages.length === parsedLimit
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

    async removeReaction(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;
            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ success: false, error: 'Message not found' });
            }
            await message.removeReaction(userId);
            const io = getIO();
            if (io) {
                const targets = [message.from?.toString(), message.to?.toString()].filter(Boolean);
                if (message.groupId) {
                    io.to(`group_${message.groupId}`).emit('message_reaction_removed', { messageId, userId });
                } else {
                    targets.forEach((id) => io.to(id).emit('message_reaction_removed', { messageId, userId }));
                }
            }
            res.json({ success: true, data: { messageId, reactions: message.reactions } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async forwardMessage(req, res) {
        try {
            const userId = req.user.id;
            const { messageId, toUserIds = [], toGroupIds = [] } = req.body;
            const source = await Message.findById(messageId);
            if (!source || source.deleted) {
                return res.status(404).json({ success: false, error: 'Message not found' });
            }

            const created = [];
            const io = getIO();

            for (const to of toUserIds) {
                const msg = await new Message({
                    from: userId,
                    to,
                    content: source.content,
                    messageType: source.messageType,
                    fileUrl: source.fileUrl,
                    fileName: source.fileName,
                    fileSize: source.fileSize,
                    fileMimeType: source.fileMimeType,
                    forwardedFrom: source._id,
                    forwardedBy: userId,
                    forwardedAt: new Date(),
                    status: 'sent',
                }).save();
                await msg.populate('from', 'name avatar profileImage');
                created.push(msg);
                if (io) {
                    io.to(to.toString()).emit('new_message', {
                        messageId: msg._id,
                        from: msg.from,
                        to,
                        content: msg.content,
                        messageType: msg.messageType,
                        fileUrl: msg.fileUrl,
                        fileName: msg.fileName,
                        forwardedFrom: source._id,
                        status: 'sent',
                        timestamp: msg.createdAt,
                    });
                }
            }

            for (const groupId of toGroupIds) {
                const group = await ChatGroup.findById(groupId);
                if (!group || !group.members.some((m) => m.user.toString() === userId.toString())) continue;
                const msg = await new Message({
                    from: userId,
                    groupId,
                    content: source.content,
                    messageType: source.messageType,
                    fileUrl: source.fileUrl,
                    fileName: source.fileName,
                    fileSize: source.fileSize,
                    fileMimeType: source.fileMimeType,
                    forwardedFrom: source._id,
                    forwardedBy: userId,
                    forwardedAt: new Date(),
                    status: 'sent',
                }).save();
                await msg.populate('from', 'name avatar profileImage');
                created.push(msg);
                if (io) {
                    io.to(`group_${groupId}`).emit('new_group_message', {
                        messageId: msg._id,
                        from: msg.from,
                        groupId,
                        content: msg.content,
                        message: msg,
                        messageType: msg.messageType,
                        fileUrl: msg.fileUrl,
                        fileName: msg.fileName,
                        forwardedFrom: source._id,
                        timestamp: msg.createdAt,
                    });
                }
            }

            res.status(201).json({ success: true, data: created, count: created.length });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async searchMessages(req, res) {
        try {
            const userId = req.user.id;
            const { q, withUserId, groupId, limit = 40 } = req.query;
            if (!q?.trim()) {
                return res.status(400).json({ success: false, error: 'Query is required' });
            }

            const filter = {
                deleted: { $ne: true },
                $text: { $search: q.trim() },
            };

            if (groupId) {
                filter.groupId = groupId;
            } else if (withUserId) {
                filter.$or = [
                    { from: userId, to: withUserId },
                    { from: withUserId, to: userId },
                ];
            } else {
                const groups = await ChatGroup.find({ 'members.user': userId, isActive: true }).select('_id');
                const groupIds = groups.map((g) => g._id);
                filter.$or = [
                    { from: userId },
                    { to: userId },
                    { groupId: { $in: groupIds } },
                ];
            }

            let messages;
            try {
                messages = await Message.find(filter, { score: { $meta: 'textScore' } })
                    .sort({ score: { $meta: 'textScore' } })
                    .limit(parseInt(limit, 10))
                    .populate('from', 'name')
                    .populate('to', 'name');
            } catch {
                // Fallback if text index not ready yet
                const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                const fallback = { deleted: { $ne: true }, $or: [{ content: regex }, { fileName: regex }] };
                if (withUserId) {
                    fallback.$and = [{
                        $or: [
                            { from: userId, to: withUserId },
                            { from: withUserId, to: userId },
                        ],
                    }];
                }
                if (groupId) fallback.groupId = groupId;
                messages = await Message.find(fallback)
                    .sort({ createdAt: -1 })
                    .limit(parseInt(limit, 10))
                    .populate('from', 'name')
                    .populate('to', 'name');
            }

            res.json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async toggleStar(req, res) {
        try {
            const userId = req.user.id;
            const message = await Message.findById(req.params.messageId);
            if (!message) {
                return res.status(404).json({ success: false, error: 'Message not found' });
            }
            await message.toggleStar(userId);
            const starred = message.starredBy.some((id) => id.toString() === userId.toString());
            res.json({ success: true, data: { messageId: message._id, starred, starredBy: message.starredBy } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getPreferences(req, res) {
        try {
            const userId = req.user.id;
            const prefs = await ChatPreference.find({ userId });
            res.json({ success: true, data: prefs });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async upsertPreference(req, res) {
        try {
            const userId = req.user.id;
            const { peerId } = req.params;
            const { peerType = 'user', muted, pinned, archived, blocked, draft } = req.body;

            const update = {};
            if (typeof muted === 'boolean') update.muted = muted;
            if (typeof pinned === 'boolean') update.pinned = pinned;
            if (typeof archived === 'boolean') update.archived = archived;
            if (typeof blocked === 'boolean') update.blocked = blocked;
            if (typeof draft === 'string') update.draft = draft;

            const pref = await ChatPreference.findOneAndUpdate(
                { userId, peerId, peerType },
                { $set: update, $setOnInsert: { userId, peerId, peerType } },
                { upsert: true, new: true }
            );

            res.json({ success: true, data: pref });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getStarredMessages(req, res) {
        try {
            const userId = req.user.id;
            const messages = await Message.find({
                starredBy: userId,
                deleted: { $ne: true },
            })
                .sort({ createdAt: -1 })
                .limit(100)
                .populate('from', 'name')
                .populate('to', 'name');
            res.json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
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
