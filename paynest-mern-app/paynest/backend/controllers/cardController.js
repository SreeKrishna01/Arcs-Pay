const Card = require("../models/Card");

// @route GET /api/cards
const getCards = async (req, res) => {
  const cards = await Card.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ cards });
};

// @route POST /api/cards
const createCard = async (req, res) => {
  try {
    const { cardHolder, cardNumber, network, expiry, color, spendingLimit, linkedAccount } = req.body;

    if (!cardHolder || !cardNumber || !expiry) {
      return res.status(400).json({ message: "Card holder, card number and expiry are required" });
    }

    const card = await Card.create({
      user: req.user._id,
      cardHolder,
      cardNumber: cardNumber.slice(-4),
      network,
      expiry,
      color,
      spendingLimit,
      linkedAccount,
    });

    res.status(201).json({ card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/cards/:id/freeze
const toggleFreeze = async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });

    card.frozen = !card.frozen;
    await card.save();
    res.json({ card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/cards/:id/limit
const updateLimit = async (req, res) => {
  try {
    const { spendingLimit } = req.body;
    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });

    card.spendingLimit = spendingLimit;
    await card.save();
    res.json({ card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/cards/:id
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json({ message: "Card removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCards, createCard, toggleFreeze, updateLimit, deleteCard };
