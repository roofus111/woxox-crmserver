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
        const { from, to, message, messageType = 'text', fileData } = data;
        let fileUrl = null;
        if (fileData && messageType !== 'text') {
          fileUrl = await uploadFileToS3(fileData);
        }

        const newMessage = await new Message({
          from, to, content: message, messageType, fileUrl,
          fileName: fileData?.name, fileSize: fileData?.size
        }).save();

        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
          io.to(recipientSocket).emit("new_message", {
            messageId: newMessage._id,
            from, message, messageType, fileUrl, timestamp: newMessage.timestamp
          });
        }

        socket.emit("message_sent", { success: true, messageId: newMessage._id });
      } catch (err) {
        console.error("Private message error:", err);
        socket.emit("message_sent", { success: false, error: "Send failed" });
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

    // Other events: typing, group messaging, mark read, etc. can be added here...
  });

  return io;
}

module.exports = { initializeSocket };
