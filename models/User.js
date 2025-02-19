const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', 
    // required: true 
 },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  socketId: { type: String },
  role: {
    type: String,
    enum: ["admin", "manager", "user", "guest","hr","docteam","finance",'pipeline'],
    default: "guest",
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
