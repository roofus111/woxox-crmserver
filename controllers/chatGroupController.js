const ChatGroup = require('../models/ChatGroup');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO, getOnlineUserIds } = require('../socketServer');

const getCompanyId = (user) => {
  if (!user?.company) return null;
  if (typeof user.company === 'object' && user.company._id) return user.company._id;
  return user.company;
};

const isMember = (group, userId) =>
  group.members.some((m) => m.user.toString() === userId.toString());

const chatGroupController = {
  async listGroups(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const groups = await ChatGroup.find({
        isActive: true,
        'members.user': userId,
      })
        .populate('members.user', 'name firstName lastName profileImage role')
        .populate('creator', 'name')
        .sort({ updatedAt: -1 });

      const onlineIds = new Set(getOnlineUserIds());
      const data = await Promise.all(
        groups.map(async (group) => {
          const lastMessage = await Message.findOne({
            groupId: group._id,
            deleted: { $ne: true },
          })
            .sort({ createdAt: -1 })
            .populate('from', 'name');

          return {
            ...group.toObject(),
            lastMessage,
            onlineMemberCount: group.members.filter((m) =>
              onlineIds.has(m.user?._id?.toString() || m.user?.toString())
            ).length,
          };
        })
      );

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createGroup(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const companyId = getCompanyId(req.user);
      const { name, description, memberIds = [], avatar } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ success: false, error: 'Group name is required' });
      }

      const uniqueMemberIds = [...new Set([userId.toString(), ...memberIds.map(String)])];

      if (companyId) {
        const companyUsers = await User.find({
          _id: { $in: uniqueMemberIds },
          company: companyId,
        }).select('_id');
        const allowed = new Set(companyUsers.map((u) => u._id.toString()));
        if (![...uniqueMemberIds].every((id) => allowed.has(id))) {
          return res.status(403).json({ success: false, error: 'Members must be in your company' });
        }
      }

      const members = uniqueMemberIds.map((id) => ({
        user: id,
        role: id === userId.toString() ? 'admin' : 'member',
      }));

      const group = await ChatGroup.create({
        name: name.trim(),
        description: description || '',
        creator: userId,
        members,
        avatar: avatar || '',
        company: companyId || undefined,
      });

      await group.populate('members.user', 'name firstName lastName profileImage role');
      await group.populate('creator', 'name');

      const io = getIO();
      if (io) {
        uniqueMemberIds.forEach((id) => {
          io.to(id.toString()).emit('group_created', { group });
        });
      }

      res.status(201).json({ success: true, data: group });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getGroup(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const group = await ChatGroup.findById(req.params.groupId)
        .populate('members.user', 'name firstName lastName profileImage role')
        .populate('creator', 'name');

      if (!group || !isMember(group, userId)) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      res.json({ success: true, data: group });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateGroup(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const group = await ChatGroup.findById(req.params.groupId);
      if (!group || !isMember(group, userId)) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      const me = group.members.find((m) => m.user.toString() === userId.toString());
      if (me?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can update the group' });
      }

      const { name, description, avatar } = req.body;
      if (name != null) group.name = name.trim();
      if (description != null) group.description = description;
      if (avatar != null) group.avatar = avatar;
      await group.save();

      await group.populate('members.user', 'name firstName lastName profileImage role');
      res.json({ success: true, data: group });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addMembers(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const { memberIds = [] } = req.body;
      const group = await ChatGroup.findById(req.params.groupId);
      if (!group || !isMember(group, userId)) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      const me = group.members.find((m) => m.user.toString() === userId.toString());
      if (me?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can add members' });
      }

      const existing = new Set(group.members.map((m) => m.user.toString()));
      memberIds.forEach((id) => {
        if (!existing.has(id.toString())) {
          group.members.push({ user: id, role: 'member' });
        }
      });
      await group.save();
      await group.populate('members.user', 'name firstName lastName profileImage role');

      const io = getIO();
      if (io) {
        memberIds.forEach((id) => io.to(id.toString()).emit('group_updated', { group }));
        io.to(`group_${group._id}`).emit('group_updated', { group });
      }

      res.json({ success: true, data: group });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async leaveGroup(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const group = await ChatGroup.findById(req.params.groupId);
      if (!group) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      group.members = group.members.filter((m) => m.user.toString() !== userId.toString());
      if (!group.members.length) group.isActive = false;
      await group.save();

      const io = getIO();
      if (io) {
        io.to(`group_${group._id}`).emit('group_member_left', {
          groupId: group._id,
          userId,
        });
      }

      res.json({ success: true, message: 'Left group' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getGroupMessages(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const { groupId } = req.params;
      const { page = 1, limit = 50, before } = req.query;
      const group = await ChatGroup.findById(groupId);
      if (!group || !isMember(group, userId)) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      const query = { groupId, deleted: { $ne: true } };
      if (before) query.createdAt = { $lt: new Date(before) };

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .populate('from', 'name avatar profileImage')
        .populate('replyTo', 'content messageType fileName from')
        .populate('mentions', 'name');

      res.json({
        success: true,
        data: messages.reverse(),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          hasMore: messages.length === parseInt(limit, 10),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async sendGroupMessage(req, res) {
    try {
      const from = req.user.id || req.user._id;
      const { groupId } = req.params;
      const {
        content,
        messageType = 'text',
        fileUrl,
        fileName,
        fileSize,
        fileMimeType,
        replyTo,
        clientMessageId,
        mentions = [],
      } = req.body;

      const group = await ChatGroup.findById(groupId);
      if (!group || !isMember(group, from)) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      const message = await new Message({
        from,
        groupId,
        content: content || fileName || '',
        messageType,
        fileUrl,
        fileName,
        fileSize,
        fileMimeType,
        replyTo,
        clientMessageId,
        mentions,
        status: 'sent',
      }).save();

      await message.populate('from', 'name avatar profileImage');
      if (replyTo) await message.populate('replyTo', 'content messageType fileName from');
      if (mentions?.length) await message.populate('mentions', 'name');

      const io = getIO();
      if (io) {
        io.to(`group_${groupId}`).emit('new_group_message', {
          messageId: message._id,
          from: message.from,
          groupId,
          content: message.content,
          message,
          messageType: message.messageType,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          replyTo: message.replyTo,
          mentions: message.mentions,
          clientMessageId,
          timestamp: message.createdAt,
        });
      }

      group.updatedAt = new Date();
      await group.save();

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = chatGroupController;
