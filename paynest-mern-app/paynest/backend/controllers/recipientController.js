const Recipient = require("../models/Recipient");

// @route GET /api/recipients
const getRecipients = async (req, res) => {
  const recipients = await Recipient.find({ user: req.user._id }).sort({ favorite: -1, name: 1 });
  res.json({ recipients });
};

// @route POST /api/recipients
const createRecipient = async (req, res) => {
  try {
    const { name, upiId, email, phone } = req.body;
    if (!name || !upiId) {
      return res.status(400).json({ message: "Name and UPI ID are required" });
    }

    const existing = await Recipient.findOne({ user: req.user._id, upiId });
    if (existing) return res.status(400).json({ message: "This recipient already exists" });

    const colors = ["#8B5CF6", "#EC4899", "#6366F1", "#22C55E", "#F59E0B", "#F43F5E"];
    const recipient = await Recipient.create({
      user: req.user._id,
      name,
      upiId,
      email,
      phone,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    });

    res.status(201).json({ recipient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/recipients/:id/favorite
const toggleFavorite = async (req, res) => {
  try {
    const recipient = await Recipient.findOne({ _id: req.params.id, user: req.user._id });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    recipient.favorite = !recipient.favorite;
    await recipient.save();
    res.json({ recipient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/recipients/:id
const deleteRecipient = async (req, res) => {
  try {
    const recipient = await Recipient.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });
    res.json({ message: "Recipient removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRecipients, createRecipient, toggleFavorite, deleteRecipient };
