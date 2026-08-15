// Seeds demo login accounts (no seeded transactions/cards/recipients/notifications).
// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");

const DEMO_MOBILE = "9676543210";
const DEMO_EMAIL = "sreekrishnan@email.com";
const DEMO_PASSWORD = "password123";
const DEMO_UPI_PIN = "123456";

const ADMIN_MOBILE = "9000000000";
const ADMIN_EMAIL = "iiyyanar478@gmail.com";
const ADMIN_PASSWORD = "282007";
const ADMIN_BALANCE = 100000;

const run = async () => {
  await connectDB();

  console.log("Clearing existing demo data...");
  const existing = await User.findOne({ mobile: DEMO_MOBILE });
  if (existing) {
    await User.deleteOne({ _id: existing._id });
  }

  console.log("Creating demo user (Sree Krishnan)...");
  const user = new User({
    name: "Sree Krishnan",
    email: DEMO_EMAIL,
    mobile: DEMO_MOBILE,
    password: DEMO_PASSWORD,
    upiId: "sreekrishnan@upi",
    avatarColor: "#8B5CF6",
    balance: 0,
  });
  await user.setUpiPin(DEMO_UPI_PIN);
  await user.save();

  console.log("\nCreating admin account (₹1,00,000 balance)...");
  const existingAdmin = await User.findOne({ mobile: ADMIN_MOBILE });
  if (existingAdmin) {
    existingAdmin.role = "admin";
    existingAdmin.isActive = true;
    existingAdmin.balance = ADMIN_BALANCE;
    existingAdmin.email = ADMIN_EMAIL;
    existingAdmin.password = ADMIN_PASSWORD;
    existingAdmin.upiId = "admin@arcspay";
    await existingAdmin.save();
  } else {
    const admin = new User({
      name: "Admin",
      email: ADMIN_EMAIL,
      mobile: ADMIN_MOBILE,
      password: ADMIN_PASSWORD,
      upiId: "admin@arcspay",
      avatarColor: "#F59E0B",
      role: "admin",
      isActive: true,
      balance: ADMIN_BALANCE,
    });
    await admin.save();
  }

  console.log("\nSeed complete! Demo login credentials:");
  console.log(`  Email/Mobile: ${DEMO_EMAIL} or ${DEMO_MOBILE}`);
  console.log(`  Password:     ${DEMO_PASSWORD}`);
  console.log(`  UPI PIN:      ${DEMO_UPI_PIN}`);
  console.log("");
  console.log("Admin portal credentials (open the admin app at http://localhost:5174):");
  console.log(`  Email/Mobile: ${ADMIN_EMAIL} or ${ADMIN_MOBILE}`);
  console.log(`  Password:     ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
