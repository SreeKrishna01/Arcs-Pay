const User = require("../models/User");

// @route PUT /api/users/me
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (email !== undefined) user.email = email ? email.toLowerCase() : user.email;

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/users/me/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/users/me/upi-pin
const setUpiPin = async (req, res) => {
  try {
    const { pin, currentPin } = req.body;
    const user = req.user;

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: "UPI PIN must be 4-6 digits" });
    }

    if (user.upiPin) {
      if (!currentPin || !(await user.matchUpiPin(currentPin))) {
        return res.status(400).json({ message: "Current UPI PIN is incorrect" });
      }
    }

    await user.setUpiPin(pin);
    await user.save();
    res.json({ message: "UPI PIN updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/users/me/settings
const updateSettings = async (req, res) => {
  try {
    const user = req.user;
    const allowedKeys = ["theme", "language", "notificationsEnabled", "biometricLogin", "twoStepVerification", "fingerprintEnabled", "paymentMethod"];

    allowedKeys.forEach((key) => {
      if (req.body[key] !== undefined) {
        user.settings[key] = req.body[key];
      }
    });

    await user.save();
    res.json({ settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { updateProfile, changePassword, setUpiPin, updateSettings };
