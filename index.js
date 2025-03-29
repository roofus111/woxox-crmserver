require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerjsdoc=require("swagger-jsdoc")
const swaggerui=require("swagger-ui-express")
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes"); 
const leadsRoutes = require("./routes/leadsRoutes");
const excelRoutes = require("./routes/excelRoutes");
const leadactivity = require("./routes/leadActivityRoutes");
const followUp = require("./routes/followRoutes");
const documentation = require("./routes/documentation");
const sales = require("./routes/salesRoutes");
const invoice = require("./routes/invoiceRoutes");
const payment = require("./routes/paymentRoutes");
const Note = require("./routes/noteRoutes");  
const Task = require("./routes/taskRoutes");
const Pipeline =require("./routes/pipelineRoutes")
const Campaign =require("./routes/campaignRoutes")
const Customer=require("./routes/customerRoutes")
const Ticket=require("./routes/TicketRoutes")
const HR= require("./routes/hrRoutes")
const Files=require("./routes/FileHandlerRoutes")
const Folder=require("./routes/folderRoutes")
const Attendance=require('./routes/attendanceRouter')
const TagModel=require('./routes/TagModelRoutes')
const payroll=require('./routes/payrollRoutes')
const taskcalender = require('./Calender/routes/taskcalenderRoutes');
const eventcalender = require('./Calender/routes/eventcalenderRoutes');
const employeeScheduleRouter = require('./Calender/routes/employeeScheduleRouter');
const Blog=require('./routes/blogRouter')
const expenseRouter=require('./routes/ExpenseRouter')
const accountRoutes=require('./routes/accountRoutes')
const tagMManagerRoutes=require('./routes/tagmanagerRoutes')
const InsightsRoutes=require('./routes/InsightsRoutes')
const incomeRoutes=require('./routes/incomeRoutes')
const categoryRoutes=require('./routes/categoryRoutes')
const {unassignUntouchedLeadsAfter30Days}=require("./controllers/leadsController")
const app = express();
const http = require("http"); // Import Node's HTTP module
const { Server } = require("socket.io"); // Import Socket.IO Server class
const scheduleJobs = require("./controllers/followUpController");
const User = require("./models/User");
const server = http.createServer(app);
const cron = require("node-cron");
const LeadFollowUp = require("./models/followUp");
const alertBeforeMinutes = 30;
const io = new Server(server, {
  cors: {
    origin: ["https://www.woxox.canbridge.in", "https://www.app.woxox.com"],  // Allow requests from this origin and my frontend port = 5173
    methods: ["GET", "POST","PUT"], // Allow these HTTP methods
  },
});
const Message = require("./models/Message");
const ChatGroup = require("./models/ChatGroup");
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on(
  "error",
  console.error.bind(console, "connection error:")
);
mongoose.connection.once("open", () => console.log("Connected to MongoDB"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/user-profiles", userProfileRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/leadactivity", leadactivity);
app.use("/api/followups", followUp);
app.use("/api/documentation", documentation);
app.use("/api/sales", sales); // is this using?
app.use("/api/invoice", invoice);
app.use("/api/payment", payment);
app.use("/api/notes", Note);
app.use("/api/tasks", Task);
app.use("/api/pipelines",Pipeline) 
app.use("/api/campaign",Campaign)
app.use("/api/customer",Customer)
app.use("/api/ticket",Ticket)
app.use("/api/hr",HR)
app.use("/api/files",Files)
app.use("/api/folders",Folder)
app.use("/api/attendance",Attendance)
app.use("/api/TagModel",TagModel)
app.use("/api/payroll",payroll)
app.use("/api/taskcalender",taskcalender)
app.use("/api/eventcalender",eventcalender)
app.use("/api/employeeSchedule",employeeScheduleRouter)
app.use("/api/expense",expenseRouter)
app.use("/api/blog",Blog)
app.use("/api/account",accountRoutes)
app.use("/api/tagmanager",tagMManagerRoutes)
app.use("/api/Insights",InsightsRoutes)
app.use("/api/income",incomeRoutes)
app.use("/api/category",categoryRoutes)
// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}); 

// Track online users and typing status
const onlineUsers = new Map();
const typingUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.emit("welcome", { message: "Welcome to the enhanced chat system!" });

  // Register user and update online status
  socket.on("register", async (userId) => {
    try {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { socketId: socket.id });
      
      // Broadcast online status to all users
      io.emit("user_status_change", {
        userId,
        status: "online"
      });
      
      console.log(`User ${userId} registered with socket ${socket.id}`);
    } catch (error) {
      console.error("Error registering user:", error);
    }
  });

  // Handle private messages
  socket.on("private_message", async (data) => {
    try {
      const { from, to, message, messageType = 'text', fileData } = data;
      
      let fileUrl = null;
      if (fileData && messageType !== 'text') {
        fileUrl = await uploadFileToS3(fileData);
      }

      const newMessage = new Message({
        from,
        to,
        content: message,
        messageType,
        fileUrl,
        fileName: fileData?.name,
        fileSize: fileData?.size
      });
      await newMessage.save();

      const recipientSocket = onlineUsers.get(to);
      if (recipientSocket) {
        io.to(recipientSocket).emit("new_message", {
          messageId: newMessage._id,
          from,
          message,
          messageType,
          fileUrl,
          timestamp: newMessage.timestamp
        });
      }

      socket.emit("message_sent", { success: true, messageId: newMessage._id });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("message_sent", { success: false, error: "Failed to send message" });
    }
  });

  // Handle group messages
  socket.on("group_message", async (data) => {
    try {
      const { from, groupId, message, messageType = 'text', fileData } = data;
      
      const group = await ChatGroup.findById(groupId);
      if (!group) throw new Error("Group not found");

      let fileUrl = null;
      if (fileData && messageType !== 'text') {
        fileUrl = await uploadFileToS3(fileData);
      }

      const newMessage = new Message({
        from,
        groupId,
        content: message,
        messageType,
        fileUrl,
        fileName: fileData?.name,
        fileSize: fileData?.size
      });
      await newMessage.save();

      // Emit to all group members
      group.members.forEach(member => {
        const memberSocket = onlineUsers.get(member.user.toString());
        if (memberSocket) {
          io.to(memberSocket).emit("new_group_message", {
            messageId: newMessage._id,
            groupId,
            from,
            message,
            messageType,
            fileUrl,
            timestamp: newMessage.timestamp
          });
        }
      });

      socket.emit("message_sent", { success: true, messageId: newMessage._id });
    } catch (error) {
      console.error("Error sending group message:", error);
      socket.emit("message_sent", { success: false, error: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", ({ from, to, isGroup }) => {
    const key = isGroup ? `group:${to}` : to;
    if (!typingUsers.has(key)) {
      typingUsers.set(key, new Set());
    }
    typingUsers.get(key).add(from);

    if (isGroup) {
      socket.to(to).emit("typing_update", {
        groupId: to,
        users: Array.from(typingUsers.get(key))
      });
    } else {
      const recipientSocket = onlineUsers.get(to);
      if (recipientSocket) {
        io.to(recipientSocket).emit("typing_update", { userId: from });
      }
    }
  });

  socket.on("typing_end", ({ from, to, isGroup }) => {
    const key = isGroup ? `group:${to}` : to;
    if (typingUsers.has(key)) {
      typingUsers.get(key).delete(from);
    }

    if (isGroup) {
      socket.to(to).emit("typing_update", {
        groupId: to,
        users: Array.from(typingUsers.get(key))
      });
    } else {
      const recipientSocket = onlineUsers.get(to);
      if (recipientSocket) {
        io.to(recipientSocket).emit("typing_update", { userId: null });
      }
    }
  });

  // Handle read receipts
  socket.on("mark_read", async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        if (!message.readBy.some(read => read.user.toString() === userId)) {
          message.readBy.push({ user: userId });
          await message.save();

          // Notify message sender
          const senderSocket = onlineUsers.get(message.from.toString());
          if (senderSocket) {
            io.to(senderSocket).emit("message_read", {
              messageId,
              readBy: userId,
              timestamp: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        onlineUsers.delete(user._id.toString());
        await User.findByIdAndUpdate(user._id, { $unset: { socketId: 1 } });
        
        // Broadcast offline status
        io.emit("user_status_change", {
          userId: user._id,
          status: "offline"
        });
      }
      console.log(`Client disconnected: ${socket.id}`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});

// Helper function to upload files to S3
async function uploadFileToS3(fileData) {
  try {
    const key = `chat-files/${Date.now()}-${fileData.name}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileData.buffer,
      ContentType: fileData.mimetype
    }));
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

cron.schedule("0,30 * * * *", async () => {
  console.log("Running follow-up check");
  try {
    const now = new Date();
    const alertBeforeMinutes = 30; // Adjust this value as needed
    const upcomingFollowUps = await LeadFollowUp.find({
      nextFollowUpDate: {
        $gte: now,
        $lte: new Date(now.getTime() + alertBeforeMinutes * 60000),
      },
      status: { $in: ["Pending", "In Progress"] },
    })
      .populate("assignedTo")
      .populate("leadId") 
      .exec();

    if (upcomingFollowUps.length) {
      console.log(`Found ${upcomingFollowUps.length} upcoming follow-ups`);
    }
    console.log(upcomingFollowUps);

    upcomingFollowUps.forEach((followUp) => {
      const userId = followUp.assignedTo._id.toString();

      const hours = followUp.nextFollowUpDate.getHours();
      const minutes = followUp.nextFollowUpDate.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";

      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

      if (onlineUsers.has(userId)) {
        const message = `You have a Follow-up Meeting with ${followUp.leadId.name} today at ${formattedTime}`;
        io.to(userId).emit("followUpAlert", {
          message: message,
          details: followUp,
        });
        console.log(`Alert sent to user ${userId}: ${message}`);
      } else {
        console.log(`User ${userId} not connected, skipping notification`);
      }
    });
  } catch (error) {
    console.error("Cron job failed:", error);
  }
});

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled task: unassign untouched leads after 30 days...');
  await unassignUntouchedLeadsAfter30Days();
});
const options={
  definition:{
    openapi:"3.0.0",
    info:{
      title: "CRM documentation",
      version:"0.1.0", 
      description:"API documentation made with express and node.js documented with swagger",
    },
    servers:[{
      url:"http://app.canbridge.in",
      // url:"http://localhost:8000",
    },
  ],
  },
  apis:["./routes/*.js"],
};
const spacs=swaggerjsdoc(options)
app.use(
  "/api-docs",
  swaggerui.serve,
  swaggerui.setup(spacs)
)
// Start server
server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});

app.get("/", (req, res) => res.status(200).send("OK"));
