// controllers/userController.js — CRUD for user management (admin) + self-service

const User   = require("../models/User");
const logger = require("../config/logger");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────────────────
// GET /api/users          (admin)
// ─────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.$or  = [
      { username: { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      users:      users.map((u) => u.toPublic()),
      pagination: {
        total,
        page:       Number(page),
        pages:      Math.ceil(total / limit),
        limit:      Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/users/:id      (admin or self)
// ─────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const isSelf  = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// PUT /api/users/:id      (admin)
// ─────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { email, username, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (email)    user.email    = email;
    if (username) user.username = username;
    if (role)     user.role     = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    logger.info(`User updated: ${user.username} by admin ${req.user.username}`);
    res.json({ message: "User updated.", user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/users/:id   (admin)
// ─────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    logger.info(`User deleted: ${user.username} by admin ${req.user.username}`);
    res.json({ message: "User deleted." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/users/me/wallet   (protected — self)
// Link or update connected Ethereum wallet address
// ─────────────────────────────────────────────────────────
const updateWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress },
      { new: true, runValidators: true }
    );

    logger.info(`Wallet linked: ${user.username} → ${walletAddress}`);
    res.json({ message: "Wallet address updated.", user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/users/me/password   (protected — self)
// ─────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password     = newPassword;
    user.refreshTokens = [];    // invalidate all sessions on password change
    await user.save();

    logger.info(`Password changed: ${user.username}`);
    res.json({ message: "Password changed. Please log in again." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateWallet,
  changePassword,
};