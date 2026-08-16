require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL or ADMIN_PASSWORD is missing in environment variables"
      );
    }

    const existingAdmin = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.isActive = true;
      existingAdmin.password = password;

      await existingAdmin.save();

      console.log("Admin user updated successfully");
    } else {
      await User.create({
        name: "Arcs Pay Admin",
        email: email.toLowerCase(),
        mobile: "9999999999",
        password: password,
        role: "admin",
        isActive: true,
        balance: 100000,
        upiId: "admin@arcspay",
      });

      console.log("Admin user created successfully");
    }

    await mongoose.disconnect();
    console.log("Done");
  } catch (error) {
    console.error("Admin creation failed:", error);
    process.exit(1);
  }
}

createAdmin();
