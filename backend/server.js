/**
 * server.js — ChainVote Backend Entry Point
 * Express + MongoDB + JWT authentication
 */

require("dotenv").config();
const express    = require("express");
const helmet     = require("helmet");
const cors       = require("cors");
const morgan     = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB  = require("./config/db");
const logger     = require("./config/logger");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// ── Route imports ────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

// ── Connect Database ─────────────────────────────────────
connectDB();

const app = express();

// ── Security middleware ──────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,                  // allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body parsing ─────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── HTTP logging ─────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ── Health check ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ───────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ── Error handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀  ChainVote backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;