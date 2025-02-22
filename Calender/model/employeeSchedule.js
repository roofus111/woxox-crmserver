const mongoose = require("mongoose");

const EmployeeScheduleSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Keeping it as "Employee"
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    shifts: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          required: true,
        },
        startTime: {
          type: String, // Keeping HH:MM format
          required: true,
        },
        endTime: {
          type: String,
          required: true,
          validate: {
            validator: function (value) {
              return value > this.startTime;
            },
            message: "End time must be after start time.",
          },
        },
        timezone: {
          type: String,
          default: "UTC",
        },
        breakTime: {
          type: Number, // In minutes (e.g., 30 for a 30-minute break)
          default: 0,
        },
      }
    ],
    assignedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaskCalender",
      }
    ],
    assignedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      }
    ],
    status: {
      type: String,
      enum: ["Active", "On Leave", "Unavailable"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeSchedule", EmployeeScheduleSchema);
