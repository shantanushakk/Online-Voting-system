// controllers/authController.js — Register · Login · Refresh · Logout · Me

const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const logger = require("../config/logger");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days in ms
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS   = 15 * 60 * 1000;  // 15 minutes

// ─────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Only admins can create admin accounts
    if (role === "admin") {
      const requestingUser = req.user;  // set by protect middleware if token provided
      if (!requestingUser || requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create admin accounts." });
      }
    }

    const user = await User.create({ username, email, password, role: role || "voter" });

    logger.info(`New user registered: ${user.username} [${user.role}]`);

    res.status(201).json({
      message: "Account created successfully.",
      user:    user.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Load user WITH password field (normally hidden)
    const user = await User.findOne({
      $or: [{ username }, { email: username }],   // accept username OR email
    }).select("+password +refreshTokens +loginAttempts +lockedUntil");

    // ── Account not found (generic message to avoid enumeration) ──
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // ── Account disabled ──
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled. Contact an administrator." });
    }

    // ── Account locked ──
    if (user.isLocked()) {
      const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Account is temporarily locked. Try again in ${remaining} minute(s).`,
      });
    }

    // ── Password check ──
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil   = new Date(Date.now() + LOCK_DURATION_MS);
        user.loginAttempts = 0;
        await user.save();
        return res.status(429).json({
          message: "Too many failed attempts. Account locked for 15 minutes.",
        });
      }

      await user.save();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return res.status(401).json({
        message: `Invalid username or password. ${attemptsLeft} attempt(s) remaining.`,
      });
    }

    // ── Success: reset counters ──
    user.loginAttempts = 0;
    user.lockedUntil   = null;
    user.lastLogin     = new Date();

    // ── Issue tokens ──
    const accessToken  = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token (allow up to 5 concurrent sessions)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save();

    // Refresh token in httpOnly cookie (browser clients)
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    logger.info(`Login: ${user.username} [${user.role}] from ${req.ip}`);

    res.json({
      message:      "Login successful.",
      accessToken,
      refreshToken, // also returned in body for non-browser clients (mobile/desktop)
      user:         user.toPublic(),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Body: { refreshToken } OR cookie
// ─────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token =
      req.body.refreshToken ||
      req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Refresh token not provided." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token." });
    }

    const user = await User.findById(decoded.id).select("+refreshTokens");
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Ensure token is in the stored list (rotation check)
    if (!user.refreshTokens.includes(token)) {
      // Possible token reuse attack — revoke ALL tokens
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({ message: "Refresh token reuse detected. Please log in again." });
    }

    // Rotate: remove old, issue new
    const newAccessToken  = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshTokens = user.refreshTokens
      .filter((t) => t !== token)
      .concat(newRefreshToken)
      .slice(-5);

    await user.save();

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/logout   (protected)
// Removes current refresh token — logs out this device only
// ─────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    const user = await User.findById(req.user._id).select("+refreshTokens");
    if (user && token) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await user.save();
    }

    res.clearCookie("refreshToken");
    logger.info(`Logout: ${req.user.username}`);
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/logout-all   (protected)
// Revokes ALL refresh tokens — logs out every device
// ─────────────────────────────────────────────────────────
const logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshTokens: [] });
    res.clearCookie("refreshToken");
    logger.info(`All sessions revoked: ${req.user.username}`);
    res.json({ message: "All sessions logged out." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/auth/me   (protected)
// ─────────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, logoutAll, me };