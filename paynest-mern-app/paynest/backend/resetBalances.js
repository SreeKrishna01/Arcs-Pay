// Sets every user balance to ₹0 and resets the admin balance to ₹1,00,000.
// Run with: npm run reset
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const ADMIN_BALANCE = 100000;

const run = async () => {
  await connectDB();

  const users = await User.updateMany({ role: "user" }, { $set: { balance: 0 } });
  console.log(`Reset ${users.modifiedCount} user balance(s) to ₹0`);

  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    admin.balance = ADMIN_BALANCE;
    admin.isActive = true;
    await admin.save();
    console.log(`Admin balance set to ₹${ADMIN_BALANCE.toLocaleString("en-IN")}`);
  } else {
    console.log("No admin account found. Run `npm run seed` to create one.");
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
