const nodemailer = require('nodemailer');
const OTP = require('../models/mailotp');
const User = require('../models/User');
const crypto = require('crypto');

function mailFromAddress() {
  const configured = (process.env.SMTP_FROM || '').trim();
  if (configured) return configured;
  // SES SMTP_USER is an access key — never use it as From
  const user = process.env.SMTP_USER || '';
  if (user.includes('@')) return `"WOXOX" <${user}>`;
  return '"WOXOX" <noreply@woxox.com>';
}

// SMTP Configuration with better error handling
const createTransporter = () => {
  // Check if required environment variables are set
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables are required');
  }

  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // true for 465, false for 587/STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  console.log('SMTP Config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    secure: config.secure,
    from: mailFromAddress(),
  });

  return nodemailer.createTransport(config);
};

// Generate OTP
const generateOTP = (length = 6) => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create OTP record
const createOTPRecord = async (email, type = 'email_verification', expiryMinutes = 10) => {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    // Delete any existing unused OTPs for this email and type
    await OTP.deleteMany({ 
      email: normalizedEmail, 
      type, 
      isUsed: false 
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const otpRecord = new OTP({
      email: normalizedEmail,
      otp,
      type,
      expiresAt
    });

    await otpRecord.save();
    console.log(`OTP created for ${normalizedEmail}`);
    return otp;
  } catch (error) {
    console.error('Error creating OTP record:', error);
    throw new Error('Failed to create OTP');
  }
};

// Send email with OTP - Enhanced error handling
const sendOTPEmail = async (email, otp, type = 'email_verification') => {
  try {
    console.log(`Attempting to send ${type} email to: ${email}`);
    
    const transporter = createTransporter();
    
    // Verify SMTP connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    let subject, htmlContent;
    
    switch (type) {
      case 'email_verification':
        subject = 'Email Verification - CRM System';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Email Verification</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Please verify your email address</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Thank you for registering with our CRM system. To complete your registration, please use the following verification code:
              </p>
              <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  Best regards,<br>
                  CRM System Team
                </p>
              </div>
            </div>
          </div>
        `;
        break;
        
      case 'password_reset':
        subject = 'Password Reset - CRM System';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Reset your account password</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                You requested a password reset for your CRM account. Use the following code to reset your password:
              </p>
              <div style="background: #fff; border: 2px dashed #ff6b6b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="color: #ff6b6b; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  Best regards,<br>
                  CRM System Team
                </p>
              </div>
            </div>
          </div>
        `;
        break;
        
      default:
        subject = 'Verification Code - CRM System';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Verification Code</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Your verification code is:
              </p>
              <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h2>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This code will expire in 10 minutes.
              </p>
            </div>
          </div>
        `;
    }

    const mailOptions = {
      from: mailFromAddress(),
      to: email,
      subject: subject,
      html: htmlContent
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Detailed error sending email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('SMTP authentication failed. Please check your email and password.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('SMTP connection failed. Please check your host and port settings.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('SMTP connection timed out. Please check your network connection.');
    } else if (
      error.responseCode === 554 ||
      /not verified/i.test(error.response || error.message || '')
    ) {
      throw new Error(
        'Amazon SES rejected this recipient (sandbox mode). Verify the recipient email in SES, or wait for production access approval.'
      );
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

// Send email verification OTP
const sendEmailVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`Email verification requested for: ${email}`);

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Always create a fresh OTP and attempt delivery (do not pretend success if mail fails)
    const otp = await createOTPRecord(email.toLowerCase(), 'email_verification');
    await sendOTPEmail(email, otp, 'email_verification');

    res.status(200).json({
      success: true,
      message: 'Email verification OTP sent successfully',
      data: {
        email: email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Error in sendEmailVerificationOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email verification OTP',
      error: error.message
    });
  }
};

// Verify email OTP
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      type: 'email_verification',
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'OTP not found or already used'
      });
    }

    // Check if OTP is valid
    if (!otpRecord.isValid()) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'OTP is invalid, expired, or maximum attempts exceeded'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark OTP as used
    await otpRecord.markAsUsed();

    // Update user email verification status
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt
      }
    });

  } catch (error) {
    console.error('Error in verifyEmailOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: error.message
    });
  }
};

// Resend email verification OTP
const resendEmailVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate and send new OTP
    const otp = await createOTPRecord(email, 'email_verification');
    await sendOTPEmail(email, otp, 'email_verification');

    res.status(200).json({
      success: true,
      message: 'Email verification OTP resent successfully',
      data: {
        email: email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Error in resendEmailVerificationOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend email verification OTP',
      error: error.message
    });
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate and send OTP
    const otp = await createOTPRecord(email, 'password_reset');
    await sendOTPEmail(email, otp, 'password_reset');

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully',
      data: {
        email: email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Error in sendPasswordResetOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset OTP',
      error: error.message
    });
  }
};

// Verify password reset OTP and reset password
const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      type: 'password_reset',
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'OTP not found or already used'
      });
    }

    // Check if OTP is valid
    if (!otpRecord.isValid()) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'OTP is invalid, expired, or maximum attempts exceeded'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark OTP as used
    await otpRecord.markAsUsed();

    // Update user password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error in verifyPasswordResetOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Generic OTP validation
const validateOTP = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    if (!email || !otp || !type) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and type are required'
      });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      type: type,
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'OTP not found or already used'
      });
    }

    // Check if OTP is valid
    if (!otpRecord.isValid()) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'OTP is invalid, expired, or maximum attempts exceeded'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark OTP as used
    await otpRecord.markAsUsed();

    res.status(200).json({
      success: true,
      message: 'OTP validated successfully',
      data: {
        email: email,
        type: type
      }
    });

  } catch (error) {
    console.error('Error in validateOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate OTP',
      error: error.message
    });
  }
};

// Send invitation email with token
const sendInvitationEmail = async (email, invitationData) => {
  try {
    console.log(`Attempting to send invitation email to: ${email}`);
    
    const transporter = createTransporter();
    
    // Verify SMTP connection
    await transporter.verify();
    console.log('SMTP connection verified successfully'); 
    
    const invitationUrl = `${process.env.FRONTEND_URL || process.env.APP_ORIGIN || 'https://app.woxox.com'}/en/accept-invitation?token=${invitationData.token}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to WOXOX</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to join the team</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            Hello <strong>${invitationData.employeeName}</strong>,
          </p>
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            You have been invited to join WOXOX CRM. Please click the button below to accept the invitation and set up your account:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background: #0f766e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <div style="background: #fff; border: 2px solid #0f766e; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0f766e; margin-top: 0;">Your Account Details:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Role:</strong> ${invitationData.role}</p>
            <p style="margin: 10px 0;"><strong>Department:</strong> ${invitationData.department || 'Not specified'}</p>
            <p style="margin: 10px 0;"><strong>Job Title:</strong> ${invitationData.jobTitle || 'Not specified'}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Important:</strong> This invitation link will expire in 24 hours. If you don't accept it within this time, you'll need to request a new invitation.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${invitationUrl}" style="color: #0f766e; word-break: break-all;">${invitationUrl}</a>
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              WOXOX Team
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: mailFromAddress(),
      to: email,
      subject: 'Welcome to WOXOX — Account Invitation',
      html: htmlContent
    };

    console.log('Sending invitation email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Detailed error sending invitation email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('SMTP authentication failed. Please check your email and password.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('SMTP connection failed. Please check your host and port settings.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('SMTP connection timed out. Please check your network connection.');
    } else {
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  }
};

module.exports = {
  sendEmailVerificationOTP,
  verifyEmailOTP,
  resendEmailVerificationOTP,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  validateOTP,
  sendOTPEmail,
  createOTPRecord,
  sendInvitationEmail
};