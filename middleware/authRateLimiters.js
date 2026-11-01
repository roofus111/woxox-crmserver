const rateLimit = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000;

const tooMany = (message) => ({ message });

// Key on client IP + submitted email so one attacker cannot lock a victim out
// from other networks, and one email is still throttled per source.
const ipAndEmailKey = (req) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  return `${req.ip}|${email}`;
};

const base = {
  windowMs: WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
};

// Failed logins only (successful ones do not count).
const loginLimiter = rateLimit({
  ...base,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: ipAndEmailKey,
  message: tooMany('Too many login attempts. Please try again in 15 minutes.'),
});

// Broader per-IP cap against password spraying across many emails.
const loginIpLimiter = rateLimit({
  ...base,
  max: 50,
  skipSuccessfulRequests: true,
  message: tooMany('Too many login attempts from this network. Please try again later.'),
});

const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: tooMany('Too many sign-up attempts. Please try again later.'),
});

// Endpoints that send an OTP email.
const otpSendLimiter = rateLimit({
  ...base,
  max: 5,
  keyGenerator: ipAndEmailKey,
  message: tooMany('Too many verification requests. Please try again in 15 minutes.'),
});

// Endpoints that check an OTP.
const otpVerifyLimiter = rateLimit({
  ...base,
  max: 10,
  keyGenerator: ipAndEmailKey,
  message: tooMany('Too many verification attempts. Please try again in 15 minutes.'),
});

module.exports = {
  loginLimiter,
  loginIpLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
};
