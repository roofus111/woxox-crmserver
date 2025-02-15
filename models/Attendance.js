const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model for sales representatives
      required: true,
    },
    employeeId: { type: mongoose.Schema.Types.ObjectId,
       ref: 'Employee', 
       required: true 
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Leave', 'Remote', 'OD', 'Half Day', 'LOP'],
        required: true
    },
    checkInTime: {
        type: Date,
        default: null
    },
    checkOutTime: {
        type: Date,
        default: null
    },
    workHours: {
        type: Number,
        default: 0
    },
    overtimeHours: {
        type: Number,
        default: 0
    },
    breakTime: {
        type: Number,
        default: 0
    },
    shiftDetails: {
        shiftType: {
            type: String,
            enum: ['Morning', 'Afternoon', 'Night', 'Flexible'],
            default: 'Morning'
        },
        shiftStartTime: {
            type: String,
            trim: true,
            default: null
        },
        shiftEndTime: {
            type: String,
            trim: true,
            default: null
        }
    },
    leaveDetails: {
        leaveType: {
            type: String,
            enum: ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Unpaid Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave', 'Study Leave', 'Unauthorized Leave', 'Uninformed Leave'],
            default: null
        },
        leaveReason: {
            type: String,
            trim: true,
            default: null
        },
        leaveStartDate: {
            type: Date,
            default: null
        },
        leaveEndDate: {
            type: Date,
            default: null
        },
        leaveApprovalStatus: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        headOfDepartmentApproval: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        headOfDepartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    odDetails: {
        odReason: {
            type: String,
            trim: true,
            default: null
        },
        odLocation: {
            type: String,
            trim: true,
            default: null
        },
        odApprovalStatus: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

AttendanceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
