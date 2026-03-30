/**
 * scripts/seedAdmin.js
 * Run once to create the initial admin account:
 *   node scripts/seedAdmin.js
 *
 * Override defaults via env:
 *   ADMIN_USERNAME=myAdmin ADMIN_EMAIL=me@example.com ADMIN_PASSWORD=Str0ng! node scripts/seedAdmin.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User     = require("../models/User");

const ADMIN = {
  username: process.env.ADMIN_USERNAME || "admin",
  email:    process.env.ADMIN_EMAIL    || "admin@chainvote.local",
  password: process.env.ADMIN_PASSWORD || "Admin@2024!",
  role:     "admin",
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✔  Connected to MongoDB");

    const existing = await User.findOne({
      $or: [{ username: ADMIN.username }, { email: ADMIN.email }],
    });

    if (existing) {
      console.log(`ℹ  Admin '${existing.username}' already exists. Skipping seed.`);
    } else {
      const admin = await User.create(ADMIN);
      console.log(`✔  Admin created: ${admin.username} (${admin.email})`);
      console.log(`   Default password: ${ADMIN.password}`);
      console.log("   ⚠  Change this password immediately after first login!");
    }
  } catch (err) {
    console.error("✖  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();