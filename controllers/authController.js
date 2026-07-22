const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Employee = require("../models/HR");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const Company = require("../models/Company");
const {CompanyPurchase} = require("../models/Plan");

exports.register = async (req, res) => {
  const userProfile = new User({
    ...req.body,
  });

  try {
    const newProfile = await userProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

async function issueLoginSession(user, req) {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: "10h" }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    refreshSecret,
    { expiresIn: "7d" }
  );

  const refreshTokenDoc = new RefreshToken({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });
  await refreshTokenDoc.save();

  const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  let plan = null;
  if (user.company) {
    plan = await CompanyPurchase.findOne({ companyId: user.company });
  }

  return {
    token: accessToken,
    refreshToken,
    expiresIn: 3600,
    refreshTokenExpiry: new Date(refreshTokenExpiry).toISOString(),
    user: {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      companyId: user.company,
      plan,
    },
  };
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = await issueLoginSession(user, req);
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
};

/**
 * Redeem a one-time Super Admin impersonation handoff token.
 * POST /api/login-impersonation { handoffToken }
 */
exports.loginWithHandoff = async (req, res) => {
  const ImpersonationHandoff = require("../models/ImpersonationHandoff");
  const { handoffToken } = req.body || {};

  try {
    if (!handoffToken || typeof handoffToken !== "string") {
      return res.status(400).json({ message: "handoffToken required" });
    }

    const tokenHash = crypto.createHash("sha256").update(handoffToken).digest("hex");
    const handoff = await ImpersonationHandoff.findOne({ tokenHash });
    if (!handoff) {
      return res.status(401).json({ message: "Invalid or expired handoff token" });
    }
    if (handoff.usedAt) {
      return res.status(401).json({ message: "Handoff token already used" });
    }
    if (handoff.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ message: "Handoff token expired" });
    }

    const user = await User.findById(handoff.userId);
    if (!user || user.isActive === false) {
      return res.status(403).json({ message: "User account is inactive" });
    }

    handoff.usedAt = new Date();
    await handoff.save();

    const payload = await issueLoginSession(user, req);
    payload.impersonation = {
      actorEmail: handoff.actorEmail || null,
      reason: handoff.reason || null,
    };
    return res.status(200).json(payload);
  } catch (err) {
    console.error("loginWithHandoff error:", err);
    return res.status(500).json({ message: err.message || "Handoff login failed" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { _id: user_id } = req.user;
    // Assumes authentication middleware sets `req.user`
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    // Fetch user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by the `pre` save middleware
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error changing password", error: err.message });
  }
};

exports.adminChangePassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    // Validate input
    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ message: "User ID and new password are required" });
    }

    // Fetch user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by the `pre` save middleware
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error changing password", error: err.message });
  }
};

// Verify user details and provide refresh token
exports.verifyAndRefreshToken = async (req, res) => {
  try {
    try {
      console.log(req.user);
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "User account is inactive" });
      }

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "10h" }
      );

      // Return same user details with new refresh token
      return res.status(200).json({
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          companyId: user.company,
        },
      });
    } catch (tokenError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to handle token refresh
async function handleTokenRefresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token is required",
      action: "login_required",
    });
  }

  try {
    // Find user with this refresh token
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid refresh token",
        action: "login_required",
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        message: "User account is inactive",
        action: "account_inactive",
      });
    }

    // Validate refresh token
    if (!user.hasValidRefreshToken(refreshToken)) {
      // Remove invalid token
      user.removeRefreshToken(refreshToken);
      await user.save();
      return res.status(401).json({
        message: "Refresh token has expired",
        action: "login_required",
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(64).toString("hex");

    // Remove old refresh token and add new one
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(newRefreshToken, 7);
    await user.save();

    // Respond with new tokens
    return res.status(200).json({
      isValid: true,
      token: newToken,
      refreshToken: newRefreshToken,
      refreshed: true,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        companyId: user.company,
      },
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    return res.status(500).json({
      error: "An error occurred while refreshing token",
      action: "retry",
    });
  }
}

// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the refresh token in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.userId,
    });

    if (!storedToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // Check if refresh token is expired
    if (new Date() > storedToken.expiresAt) {
      // Remove expired token
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return res.status(401).json({
        message: "Refresh token expired",
      });
    }

    // Get user data
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate new refresh token (optional - for token rotation)
    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Update refresh token in database (token rotation)
    await RefreshToken.findByIdAndUpdate(storedToken._id, {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Calculate expiry times
    const accessTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600, // 1 hour in seconds
      refreshTokenExpiry: new Date(refreshTokenExpiry).toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Refresh token expired",
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Revoke refresh token (for logout)
exports.revokeToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    // Remove the refresh token from database
    await RefreshToken.findOneAndDelete({ token: refreshToken });

    res.json({
      message: "Token revoked successfully",
    });
  } catch (error) {
    console.error("Revoke token error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
