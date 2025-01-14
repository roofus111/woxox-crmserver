require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const options={
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API',
      version: '1.0.0',
      description: 'API documentation for my Express server',
    },
    servers: [
      {
        url: 'http://localhost:8000',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};
const swaggerjsdoc = require("swagger-jsdoc");
const swaggerui= require("swagger-ui-express")
const spacs=swaggerjsdoc(options)
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
app.use("/api-docs",swaggerui.serve,swaggerui.setup(spacs))
// Utility to check if a user is connected
const isUserConnected = (userId) => {
  return io.sockets.adapter.rooms.get(userId)?.size > 0;
};

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.emit("welcome", { message: "Welcome to the notification system!" });

  socket.on("register", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} registered and joined their room`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

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

      if (isUserConnected(userId)) {
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
// Start server
server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
/**
 * @swagger
 * /:
 * get:
 *  summary: To get all campaigns from mongodb
 *  description :this api is used to fetch data from mongodb
 *  responses:
 *       200: 
 *          description:this api is used to fetch data from  mongodb
 *            content:
 *                application/json
 */
app.get("/", (req, res) => res.status(200).send("OK"));
