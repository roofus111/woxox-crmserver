require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
const app = express();
const http = require('http');
const socketIo = require('socket.io');


const server = http.createServer(app);
const io = socketIo(server);


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




io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


















// Start server
app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});


app.get('/', (req, res) => res.status(200).send('OK'));
