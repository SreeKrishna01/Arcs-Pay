const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const makeUpiId = (name, mobile) => {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}${mobile.slice(-4)}@arcspay`;
};

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Name, mobile number and password are required" });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ message: "An account with this mobile number already exists" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
    }

    const colors = ["#8B5CF6", "#EC4899", "#6366F1", "#22C55E", "#F59E0B"];
    const user = await User.create({
      name,
      mobile,
      email: email ? email.toLowerCase() : undefined,
      password,
      upiId: makeUpiId(name, mobile),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      balance: 0,
    });

    await Notification.create({
      user: user._id,
      title: "Welcome to Arcs Pay! \ud83c\udf89",
      message: `Hi ${name.split(" ")[0]}, your account is ready. Add money to get started.`,
      type: "offer",
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or mobile

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/mobile and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been blocked. Contact support." });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

module.exports = { register, login, getMe };
