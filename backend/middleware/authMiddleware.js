// middleware/authMiddleware.js — JWT verification + role guard

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies Bearer access token.
 * Attaches req.user = { id, role, username } on success.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Try Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. Fallback: httpOnly cookie (for browser clients)
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorised — no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Minimal DB hit — only load what we need
    const user = await User.findById(decoded.id).select("_id username role isActive");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

/**
 * requireRole(...roles) — must be used AFTER protect.
 * e.g. requireRole("admin") or requireRole("admin", "voter")
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(" or ")}.`,
    });
  }
  next();
};

module.exports = { protect, requireRole };