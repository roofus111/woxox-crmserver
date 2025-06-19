const express = require('express');
const router = express.Router();
const {
  sendEmailVerificationOTP,
  verifyEmailOTP,
  resendEmailVerificationOTP,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  validateOTP,
  testSMTP
} = require('../controllers/mailController');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *     OTPVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         otp:
 *           type: string
 *           description: 6-digit OTP code
 *     PasswordResetRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *         - newPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         otp:
 *           type: string
 *           description: 6-digit OTP code
 *         newPassword:
 *           type: string
 *           description: New password
 */

/**
 * @swagger
 * /api/mail/send-email-verification:
 *   post:
 *     summary: Send email verification OTP
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     expiresIn:
 *                       type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/send-email-verification', sendEmailVerificationOTP);

/**
 * @swagger
 * /api/mail/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerificationRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     emailVerifiedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request or invalid OTP
 *       404:
 *         description: OTP or user not found
 *       500:
 *         description: Server error
 */
router.post('/verify-email', verifyEmailOTP);

/**
 * @swagger
 * /api/mail/resend-email-verification:
 *   post:
 *     summary: Resend email verification OTP
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationRequest'
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Bad request or email already verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/resend-email-verification', resendEmailVerificationOTP);

/**
 * @swagger
 * /api/mail/send-password-reset:
 *   post:
 *     summary: Send password reset OTP
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationRequest'
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/send-password-reset', sendPasswordResetOTP);

/**
 * @swagger
 * /api/mail/verify-password-reset:
 *   post:
 *     summary: Verify password reset OTP and reset password
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request or invalid OTP
 *       404:
 *         description: OTP or user not found
 *       500:
 *         description: Server error
 */
router.post('/verify-password-reset', verifyPasswordResetOTP);

/**
 * @swagger
 * /api/mail/validate-otp:
 *   post:
 *     summary: Validate generic OTP
 *     tags: [Mail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email_verification, password_reset, login]
 *     responses:
 *       200:
 *         description: OTP validated successfully
 *       400:
 *         description: Bad request or invalid OTP
 *       404:
 *         description: OTP not found
 *       500:
 *         description: Server error
 */
router.post('/validate-otp', validateOTP);



module.exports = router;
