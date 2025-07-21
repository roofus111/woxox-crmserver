// server.js or socketServer.js
const { Server } = require("socket.io");
const User = require("./models/User");
const Message = require("./models/Message");
const ChatGroup = require("./models/ChatGroup");


const onlineUsers = new Map();
const typingUsers = new Map();

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // adjust in production
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.emit("welcome", { message: "Welcome to the enhanced chat system!" });

    socket.on("register", async (userId) => {
      try {
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        await User.findByIdAndUpdate(userId, { socketId: socket.id });
        io.emit("user_status_change", { userId, status: "online" });
      } catch (err) {
        console.error("Register error:", err);
      }
    });

    socket.on("send_notification", async ({ to, title, message, type }) => {
      try {
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
          io.to(recipientSocket).emit("new_notification", {
            title, message, type, timestamp: new Date()
          });
        }
        socket.emit("notification_sent", { success: true, message: "Message sent" });
      } catch (error) {
        console.error("Notification error:", error);
        socket.emit("notification_sent", { success: false, error: "Failed to send" });
      }
    });

    socket.on("private_message", async (data) => {
      try {
        const { 
          from, 
          to, 
          content, 
          messageType = 'text', 
          fileData, 
          replyTo,
          clientMessageId,
          priority = 'normal'
        } = data;

        // Create message object
        const messageData = {
          from,
          to,
          content,
          messageType,
          clientMessageId,
          priority,
          status: 'sent'
        };

        // Handle file uploads if present
        if (fileData && messageType !== 'text') {
          const fileUrl = await uploadFileToS3(fileData);
          Object.assign(messageData, {
            fileUrl,
            fileName: fileData.name,
            fileSize: fileData.size,
            fileMimeType: fileData.type,
            fileMetadata: {
              dimensions: fileData.dimensions,
              duration: fileData.duration,
              thumbnail: fileData.thumbnail
            }
          });
        }

        // Handle reply
        if (replyTo) {
          messageData.replyTo = replyTo;
        }

        const newMessage = await new Message(messageData).save();

        // Emit to recipient if online
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
          io.to(recipientSocket).emit("new_message", {
            messageId: newMessage._id,
            ...messageData,
            timestamp: newMessage.createdAt
          });

          // Mark as delivered
          await newMessage.markAsDelivered();
        }

        // Confirm to sender
        socket.emit("message_sent", {
          success: true,
          messageId: newMessage._id,
          clientMessageId,
          timestamp: newMessage.createdAt,
          status: newMessage.status
        });
      } catch (err) {
        console.error("Private message error:", err);
        socket.emit("message_sent", { 
          success: false, 
          error: "Failed to send message",
          clientMessageId: data.clientMessageId 
        });
      }
    });

    // Enhanced message editing
    socket.on("edit_message", async ({ messageId, userId, newContent }) => {
      try {
        const message = await Message.findById(messageId);
        
        if (!message || message.from.toString() !== userId) {
          socket.emit("edit_failed", { 
            error: "Not authorized to edit this message",
            messageId 
          });
          return;
        }

        // Store edit history
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

        // Notify recipient
        const recipientSocket = onlineUsers.get(message.to.toString());
        if (recipientSocket) {
          io.to(recipientSocket).emit("message_edited", {
            messageId,
            newContent,
            editedAt: updatedMessage.updatedAt,
            editHistory: updatedMessage.editHistory
          });
        }

        socket.emit("edit_success", { 
          messageId, 
          content: newContent,
          updatedAt: updatedMessage.updatedAt 
        });
      } catch (err) {
        console.error("Edit message error:", err);
        socket.emit("edit_failed", { 
          error: "Failed to edit message",
          messageId 
        });
      }
    });

    // Enhanced message reactions
    socket.on("add_reaction", async ({ messageId, userId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("reaction_failed", { 
            error: "Message not found",
            messageId 
          });
          return;
        }

        await message.addReaction(userId, emoji);

        // Notify other participants
        const recipientId = message.to.toString();
        const recipientSocket = onlineUsers.get(recipientId);
        
        if (recipientSocket) {
          io.to(recipientSocket).emit("message_reaction", {
            messageId,
            userId,
            emoji,
            reactionCounts: message.reactionCounts
          });
        }

        socket.emit("reaction_success", { 
          messageId, 
          emoji,
          reactionCounts: message.reactionCounts
        });
      } catch (err) {
        console.error("Reaction error:", err);
        socket.emit("reaction_failed", { 
          error: "Failed to add reaction",
          messageId 
        });
      }
    });

    // Enhanced read receipts
    socket.on("mark_read", async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        await message.markAsRead(userId);

        // Notify sender
        const senderSocket = onlineUsers.get(message.from.toString());
        if (senderSocket) {
          io.to(senderSocket).emit("message_read", {
            messageId,
            readBy: userId,
            readAt: new Date(),
            status: message.status
          });
        }
      } catch (err) {
        console.error("Mark read error:", err);
      }
    });

    // Enhanced message deletion
    socket.on("delete_message", async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.from.toString() !== userId) {
          socket.emit("delete_failed", { 
            error: "Not authorized to delete this message",
            messageId 
          });
          return;
        }

        await message.softDelete(userId);

        // Notify recipient
        const recipientSocket = onlineUsers.get(message.to.toString());
        if (recipientSocket) {
          io.to(recipientSocket).emit("message_deleted", { 
            messageId,
            deletedAt: message.deletedAt
          });
        }

        socket.emit("delete_success", { messageId });
      } catch (err) {
        console.error("Delete message error:", err);
        socket.emit("delete_failed", { 
          error: "Failed to delete message",
          messageId 
        });
      }
    });

    // Enhanced chat history
    socket.on("get_chat_history", async ({ userId, withUserId, options = {} }) => {
      try {
        const messages = await Message.getMessageHistory(userId, withUserId, options);

        socket.emit("chat_history", { 
          messages,
          withUserId,
          pagination: {
            offset: options.offset || 0,
            limit: options.limit || 50,
            hasMore: messages.length === (options.limit || 50)
          }
        });
      } catch (err) {
        console.error("Chat history error:", err);
        socket.emit("chat_history_error", { 
          error: "Failed to fetch chat history",
          withUserId 
        });
      }
    });

    // Group Chat Features
    socket.on("join_group", async ({ userId, groupId }) => {
      try {
        const group = await ChatGroup.findById(groupId);
        if (!group) {
          socket.emit("group_error", { message: "Group not found" });
          return;
        }

        const isMember = group.members.some(member => 
          member.user.toString() === userId
        );

        if (!isMember) {
          socket.emit("group_error", { message: "Not a member of this group" });
          return;
        }

        socket.join(`group_${groupId}`);
        socket.emit("group_joined", { groupId });
      } catch (err) {
        console.error("Join group error:", err);
        socket.emit("group_error", { message: "Failed to join group" });
      }
    });

    socket.on("group_message", async (data) => {
      try {
        const { from, groupId, message, messageType = 'text', fileData } = data;
        let fileUrl = null;
        
        if (fileData && messageType !== 'text') {
          fileUrl = await uploadFileToS3(fileData);
        }

        const newMessage = await new Message({
          from,
          groupId,
          content: message,
          messageType,
          fileUrl,
          fileName: fileData?.name,
          fileSize: fileData?.size
        }).save();

        io.to(`group_${groupId}`).emit("new_group_message", {
          messageId: newMessage._id,
          from,
          groupId,
          message,
          messageType,
          fileUrl,
          timestamp: newMessage.timestamp
        });

        socket.emit("message_sent", { success: true, messageId: newMessage._id });
      } catch (err) {
        console.error("Group message error:", err);
        socket.emit("message_sent", { success: false, error: "Send failed" });
      }
    });

    // Typing Indicators
    socket.on("typing_start", ({ userId, to, isGroup = false }) => {
      const room = isGroup ? `group_${to}` : to;
      typingUsers.set(`${userId}_${room}`, true);
      socket.to(room).emit("user_typing", { userId, isTyping: true });
    });

    socket.on("typing_end", ({ userId, to, isGroup = false }) => {
      const room = isGroup ? `group_${to}` : to;
      typingUsers.delete(`${userId}_${room}`);
      socket.to(room).emit("user_typing", { userId, isTyping: false });
    });

    // Leave Group
    socket.on("leave_group", async ({ userId, groupId }) => {
      try {
        socket.leave(`group_${groupId}`);
        socket.emit("group_left", { groupId });
      } catch (err) {
        console.error("Leave group error:", err);
        socket.emit("group_error", { message: "Failed to leave group" });
      }
    });

    socket.on("disconnect", async () => {
      try {
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          if (onlineUsers.get(user._id.toString()) === socket.id) {
            onlineUsers.delete(user._id.toString());
            await User.findByIdAndUpdate(user._id, { $unset: { socketId: 1 } });
            io.emit("user_status_change", { userId: user._id, status: "offline" });
          }
        }
        console.log(`Client disconnected: ${socket.id}`);
      } catch (err) {
        console.error("Disconnect error:", err);
      }
    });

  });

  return io;
}

module.exports = { initializeSocket };
