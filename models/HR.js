const mongoose = require('mongoose');

  // Sub-schema for Attachments
const AttachmentSchema = new mongoose.Schema({
    fileName: { type: String, 
      required: true 
  },
    fileType:{ type: String},
    fileUrl: { type: String, 
      required: true
   },
  });

  
  // **Leave Schema**
  const LeaveSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', 
       // required: true 
    },
    leaveType: { type: String, enum: ['Sick', 'Casual', 'Maternity', 'Other'], 
        required: false 
    },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
   // **Attendance Schema**
   const AttendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', 
       // required: true 
    },
    date: { type: Date, required: false },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'On Leave'], required: false },
    leaves:[LeaveSchema],
    createdAt: { type: Date, default: Date.now },
  });
  
  // **Payroll Schema**
  const PayrollSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', 
        //required: true 
    },
    basicSalary: { type: Number, required: false },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: false },
    paymentDate: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now },
  });
  
  // **Performance Schema**
  const PerformanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee',
        // required: true 
        },
    reviewDate: { type: Date, required: false },
    reviewPeriod: { type: String }, // E.g., "Q1 2025"
    rating: { type: Number, min: 1, max: 5, required: false },
    feedback: { type: String },
    goals: { type: String },
    createdAt: { type: Date, default: Date.now },
  });
  

  // **Training Schema**
  const TrainingSchema = new mongoose.Schema({
    trainingName: { type: String, required: false },
    description: { type: String },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    createdAt: { type: Date, default: Date.now },
  });
  const EmployeeSchema = new mongoose.Schema({
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
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    startDate: { type: Date, required: false },
    endDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
    jobTitle: { type: String, required: false },
    department: { type: String, required: false }, // E.g., "Sales", "Marketing", "Support"
    role: { type: String, enum: ['Admin', 'Salesperson', 'Manager', 'Support'], required: false },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Reporting manager
    attachments:[AttachmentSchema],
    attendence: [AttendanceSchema],
    payroll :[PayrollSchema],
    performance:[PerformanceSchema],
    training:[TrainingSchema],
    salary: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  module.exports = mongoose.model('Employee', EmployeeSchema);