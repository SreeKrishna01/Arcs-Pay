const BankAccount = require("../models/BankAccount");

// @route GET /api/accounts
const getAccounts = async (req, res) => {
  const accounts = await BankAccount.find({ user: req.user._id }).sort({ isPrimary: -1, createdAt: 1 });
  res.json({ accounts });
};

// @route POST /api/accounts
const createAccount = async (req, res) => {
  try {
    const { bankName, accountHolder, accountNumber, ifsc, accountType, isPrimary } = req.body;

    if (!bankName || !accountHolder || !accountNumber) {
      return res.status(400).json({ message: "Bank name, account holder and account number are required" });
    }

    const count = await BankAccount.countDocuments({ user: req.user._id });

    if (isPrimary || count === 0) {
      await BankAccount.updateMany({ user: req.user._id }, { isPrimary: false });
    }

    const account = await BankAccount.create({
      user: req.user._id,
      bankName,
      accountHolder,
      accountNumber: accountNumber.slice(-4),
      ifsc,
      accountType,
      isPrimary: isPrimary || count === 0,
    });

    res.status(201).json({ account });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/accounts/:id/primary
const setPrimary = async (req, res) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    await BankAccount.updateMany({ user: req.user._id }, { isPrimary: false });
    account.isPrimary = true;
    await account.save();

    res.json({ account });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/accounts/:id
const deleteAccount = async (req, res) => {
  try {
    const account = await BankAccount.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json({ message: "Account removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAccounts, createAccount, setPrimary, deleteAccount };
