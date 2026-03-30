// config/db.js — Mongoose connection with retry logic

const mongoose = require("mongoose");
const logger   = require("./logger");

const MAX_RETRIES = 5;
let   retries     = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });

    retries = 0;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    retries++;
    logger.error(`MongoDB connection failed (attempt ${retries}): ${err.message}`);

    if (retries < MAX_RETRIES) {
      const delay = Math.min(1000 * 2 ** retries, 30000); // exponential back-off, max 30 s
      logger.info(`Retrying in ${delay / 1000}s…`);
      setTimeout(connectDB, delay);
    } else {
      logger.error("Max MongoDB retries reached. Exiting.");
      process.exit(1);
    }
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed on app termination.");
  process.exit(0);
});

module.exports = connectDB;