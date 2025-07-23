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
  profileImage: {
    fileName: { type: String },
    fileType: { type: String },
    fileUrl: { type: String }
  },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifiedAt: { type: Date },
  refreshTokens: [{
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  }],
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

// Add method to add refresh token
userSchema.methods.addRefreshToken = function(token, expiresIn = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresIn);
  
  this.refreshTokens.push({
    token,
    expiresAt
  });
  
  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Add method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

// Add method to validate refresh token
userSchema.methods.hasValidRefreshToken = function(token) {
  const refreshToken = this.refreshTokens.find(rt => rt.token === token);
  if (!refreshToken) return false;
  
  return refreshToken.expiresAt > new Date();
};

module.exports = mongoose.model("User", userSchema);
