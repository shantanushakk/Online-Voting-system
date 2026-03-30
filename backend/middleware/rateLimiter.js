// middleware/rateLimiter.js — brute-force protection on auth endpoints

const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  message: {
    message: "Too many login attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,   // only count failures
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { message: "Too many registrations from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders:   false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { loginLimiter, registerLimiter, apiLimiter };