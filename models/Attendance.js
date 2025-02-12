const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },

  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workHours: { type: Number, default: 0 }, // In hours
  overtimeHours: { type: Number, default: 0 },
  breakDuration: { type: Number, default: 0 }, // In minutes

  status: { 
    type: String, 
    enum: ["Present", "Absent", "Leave", "Remote", "Half-day","WFH"], 
    required: true 
  },

  leaveDetails: {
    type: {
      leaveType: { type: String, enum: ["Sick", "Casual", "Earned", "Unpaid"] },
      leaveStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
    },
    default: null
  },

  shiftDetails: {
    shiftName: { type: String },
    startTime: { type: String }, // e.g., "09:00 AM"
    endTime: { type: String }, // e.g., "06:00 PM"
    flexible: { type: Boolean, default: false }
  },


  lateArrival: { type: Boolean, default: false },
  earlyLeaving: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
