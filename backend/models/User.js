// models/User.js — User schema with bcrypt hashing & JWT helpers

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

const ROLES = ["admin", "voter", "observer"];

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, "Username is required"],
      unique:    true,
      trim:      true,
      minlength: [3,  "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
      match:     [/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, _ . -"],
    },

    email: {
      type:     String,
      required: [true, "Email is required"],
      unique:   true,
      trim:     true,
      lowercase: true,
      match:    [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select:    false,   // never returned in queries by default
    },

    role: {
      type:    String,
      enum:    ROLES,
      default: "voter",
    },

    // Linked Ethereum wallet (optional at registration, set on first connect)
    walletAddress: {
      type:   String,
      trim:   true,
      default: null,
      match:  [/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"],
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    // Track refresh tokens to allow per-device logout
    refreshTokens: {
      type:    [String],
      select:  false,
      default: [],
    },

    lastLogin: { type: Date, default: null },

    loginAttempts: { type: Number, default: 0 },
    lockedUntil:   { type: Date,   default: null },
  },
  {
    timestamps: true,   // createdAt, updatedAt
  }
);

// ── Pre-save: hash password ──────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance: compare password ───────────────────────────
userSchema.methods.matchPassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

// ── Instance: generate access token (short-lived) ────────
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, username: this.username },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
};

// ── Instance: generate refresh token (long-lived) ────────
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
};

// ── Instance: check if account is locked ─────────────────
userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// ── Static: safe public projection ───────────────────────
userSchema.methods.toPublic = function () {
  return {
    id:            this._id,
    username:      this.username,
    email:         this.email,
    role:          this.role,
    walletAddress: this.walletAddress,
    isActive:      this.isActive,
    lastLogin:     this.lastLogin,
    createdAt:     this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);
module.exports = User;
module.exports.ROLES = ROLES;