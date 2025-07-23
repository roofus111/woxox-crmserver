const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Employee = require('../models/HR');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const userProfile = new User({
      ...req.body
    });
  
    try {
      const newProfile = await userProfile.save();
      res.status(201).json(newProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

  exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.isActive === false) {
            return res.status(403).json({ message: 'User account is inactive' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        // Respond with user info and token
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: `${user.email}`,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                companyId: user.company,
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
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
    res.status(500).json({ message: "Error changing password", error: err.message });
  }
};

exports.adminChangePassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
      // Validate input
      if (!userId || !newPassword) {
          return res.status(400).json({ message: "User ID and new password are required" });
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
      res.status(500).json({ message: "Error changing password", error: err.message });
  }
};



// Verify user details and provide refresh token
exports.verifyAndRefreshToken = async (req, res) => {
    try {
        const accessToken = req.header('Authorization')?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify the access token and get user details
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            if (!user.isActive) {
                return res.status(403).json({ message: 'User account is inactive' });
            }

            // Generate new refresh token
            const newRefreshToken = crypto.randomBytes(64).toString('hex');
            
            // Add new refresh token to user
            user.addRefreshToken(newRefreshToken, 7);
            await user.save();

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
                }
            });

        } catch (tokenError) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

    } catch (err) {
        console.error('Token verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to handle token refresh
async function handleTokenRefresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ 
            message: 'Refresh token is required',
            action: 'login_required'
        });
    }

    try {
        // Find user with this refresh token
        const user = await User.findOne({
            'refreshTokens.token': refreshToken
        });

        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid refresh token',
                action: 'login_required'
            });
        }

        // Check if user is active
        if (user.isActive === false) {
            return res.status(403).json({ 
                message: 'User account is inactive',
                action: 'account_inactive'
            });
        }

        // Validate refresh token
        if (!user.hasValidRefreshToken(refreshToken)) {
            // Remove invalid token
            user.removeRefreshToken(refreshToken);
            await user.save();
            return res.status(401).json({ 
                message: 'Refresh token has expired',
                action: 'login_required'
            });
        }

        // Generate new access token
        const newToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        // Generate new refresh token
        const newRefreshToken = crypto.randomBytes(64).toString('hex');
        
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
            }
        });

    } catch (err) {
        console.error('Token refresh error:', err);
        return res.status(500).json({ 
            error: 'An error occurred while refreshing token',
            action: 'retry'
        });
    }
}