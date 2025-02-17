const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Sales representative
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assigned user
      required: true, // Ensure assignee is mandatory
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ToDo", "Sceduled" , "in progress", "completed"],
      default: "ToDo",
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("Event", EventSchema);
