const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const BankAccount = require("../models/BankAccount");
const Card = require("../models/Card");
const Recipient = require("../models/Recipient");
const Notification = require("../models/Notification");

const ADMIN_BALANCE = 100000;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const makeUpiId = (name, mobile) => {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${base}${mobile.slice(-4)}@arcspay`;
};

const generateTxnId = () => {
  const digits = Math.floor(100000000000 + Math.random() * 899999999999);
  return `ADM${digits}`;
};

// @route POST /api/admin/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/mobile and password are required" });
    }

    const user = await User.findOne({
      role: "admin",
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Admin account is blocked" });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/admin/me
const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

// @route GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, balanceAgg, txnCount, disbursedAgg, cardCount, accountCount, recipientCount] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "user", isActive: true }),
        User.aggregate([
          { $match: { role: "user" } },
          { $group: { _id: null, total: { $sum: "$balance" } } },
        ]),
        Transaction.countDocuments(),
        Transaction.aggregate([
          { $match: { category: "Admin Disbursement", direction: "debit" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Card.countDocuments(),
        BankAccount.countDocuments(),
        Recipient.countDocuments(),
      ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers: totalUsers - activeUsers,
        moneyInCirculation: balanceAgg[0]?.total || 0,
        adminBalance: req.user.balance,
        adminRefillTarget: ADMIN_BALANCE,
        totalTransactions: txnCount,
        totalDisbursed: disbursedAgg[0]?.total || 0,
        totalCards: cardCount,
        totalAccounts: accountCount,
        totalRecipients: recipientCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/admin/users?search=&status=&sort=
const getUsers = async (req, res) => {
  try {
    const { search, status, sort } = req.query;
    const query = { role: "user" };

    if (status === "blocked") query.isActive = false;
    if (status === "active") query.isActive = true;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { upiId: { $regex: search, $options: "i" } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      balance_high: { balance: -1 },
      balance_low: { balance: 1 },
      name: { name: 1 },
    };

    const users = await User.find(query).sort(sortMap[sort] || { createdAt: -1 }).limit(500);

    const txnAgg = await Transaction.aggregate([
      { $match: { user: { $in: users.map((u) => u._id) } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const txnMap = Object.fromEntries(txnAgg.map((t) => [String(t._id), t.count]));

    res.json({
      users: users.map((u) => {
        const safe = u.toSafeObject();
        return { ...safe, transactionCount: txnMap[String(u._id)] || 0 };
      }),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/admin/users/:id
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const [transactions, accounts, cards, recipients] = await Promise.all([
      Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(100),
      BankAccount.find({ user: user._id }),
      Card.find({ user: user._id }),
      Recipient.find({ user: user._id }),
    ]);

    res.json({
      user: { ...user.toSafeObject(), isActive: user.isActive },
      transactions,
      accounts,
      cards,
      recipients,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/admin/users/:id/send
const sendMoney = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    const admin = req.user;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid amount" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (numericAmount > admin.balance) {
      return res.status(400).json({ message: "Admin balance is insufficient. Top up to ₹1,00,000 first." });
    }

    admin.balance -= numericAmount;
    user.balance += numericAmount;
    await Promise.all([admin.save(), user.save()]);

    await Transaction.create([
      {
        user: user._id,
        transactionId: generateTxnId(),
        direction: "credit",
        type: "received",
        amount: numericAmount,
        counterpartyName: "Arcs Pay Admin",
        counterpartyUpi: "admin@arcspay",
        category: "Admin Disbursement",
        note: note || "Money distributed by admin",
        method: "Wallet",
        status: "success",
        fromLabel: "Arcs Pay Admin",
      },
      {
        user: admin._id,
        transactionId: generateTxnId(),
        direction: "debit",
        type: "sent",
        amount: numericAmount,
        counterpartyName: user.name,
        counterpartyUpi: user.upiId,
        category: "Admin Disbursement",
        note: note || `Money distributed to ${user.name}`,
        method: "Wallet",
        status: "success",
        fromLabel: "Arcs Pay Admin",
      },
    ]);

    await Notification.create({
      user: user._id,
      title: "Money Added",
      message: `Admin credited \u20b9${numericAmount.toLocaleString("en-IN")} to your Arcs Pay wallet`,
      type: "payment_received",
    });

    res.json({
      user: { ...user.toSafeObject(), isActive: user.isActive },
      adminBalance: admin.balance,
      message: `\u20b9${numericAmount.toLocaleString("en-IN")} sent to ${user.name}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/admin/users/:id/deduct
const deductMoney = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    const admin = req.user;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid amount" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (numericAmount > user.balance) {
      return res.status(400).json({ message: "User has insufficient balance to deduct" });
    }

    admin.balance += numericAmount;
    user.balance -= numericAmount;
    await Promise.all([admin.save(), user.save()]);

    await Transaction.create([
      {
        user: user._id,
        transactionId: generateTxnId(),
        direction: "debit",
        type: "sent",
        amount: numericAmount,
        counterpartyName: "Arcs Pay Admin",
        counterpartyUpi: "admin@arcspay",
        category: "Admin Reclaim",
        note: note || "Amount reclaimed by admin",
        method: "Wallet",
        status: "success",
        fromLabel: "Arcs Pay Wallet",
      },
      {
        user: admin._id,
        transactionId: generateTxnId(),
        direction: "credit",
        type: "received",
        amount: numericAmount,
        counterpartyName: user.name,
        counterpartyUpi: user.upiId,
        category: "Admin Reclaim",
        note: note || `Reclaimed from ${user.name}`,
        method: "Wallet",
        status: "success",
        fromLabel: "Arcs Pay Admin",
      },
    ]);

    await Notification.create({
      user: user._id,
      title: "Amount Deducted",
      message: `Admin deducted \u20b9${numericAmount.toLocaleString("en-IN")} from your Arcs Pay wallet`,
      type: "security",
    });

    res.json({
      user: { ...user.toSafeObject(), isActive: user.isActive },
      adminBalance: admin.balance,
      message: `\u20b9${numericAmount.toLocaleString("en-IN")} deducted from ${user.name}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, mobile, email, password, balance, note } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Name, mobile number and password are required" });
    }
    if (await User.findOne({ mobile })) {
      return res.status(400).json({ message: "An account with this mobile number already exists" });
    }
    if (email && (await User.findOne({ email: email.toLowerCase() }))) {
      return res.status(400).json({ message: "An account with this email already exists" });
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

    const initial = Number(balance);
    let adminBalance = req.user.balance;

    if (initial && initial > 0) {
      if (initial > adminBalance) {
        await User.deleteOne({ _id: user._id });
        return res.status(400).json({ message: "Admin balance is insufficient for the opening balance" });
      }
      adminBalance -= initial;
      user.balance = initial;
      await user.save();
      req.user.balance = adminBalance;
      await req.user.save();

      await Transaction.create([
        {
          user: user._id,
          transactionId: generateTxnId(),
          direction: "credit",
          type: "received",
          amount: initial,
          counterpartyName: "Arcs Pay Admin",
          counterpartyUpi: "admin@arcspay",
          category: "Admin Disbursement",
          note: note || "Opening balance credited by admin",
          method: "Wallet",
          status: "success",
          fromLabel: "Arcs Pay Admin",
        },
        {
          user: req.user._id,
          transactionId: generateTxnId(),
          direction: "debit",
          type: "sent",
          amount: initial,
          counterpartyName: user.name,
          counterpartyUpi: user.upiId,
          category: "Admin Disbursement",
          note: note || `Opening balance for ${user.name}`,
          method: "Wallet",
          status: "success",
          fromLabel: "Arcs Pay Admin",
        },
      ]);
    }

    res.status(201).json({
      user: { ...user.toSafeObject(), isActive: user.isActive },
      adminBalance,
      message: `User ${user.name} created`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/admin/users/:id/toggle-block
const toggleBlock = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();
    res.json({
      user: { ...user.toSafeObject(), isActive: user.isActive },
      message: user.isActive ? `${user.name} is now active` : `${user.name} has been blocked`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const admin = req.user;
    if (user.balance > 0) {
      admin.balance += user.balance;
      await admin.save();
    }

    await Promise.all([
      Transaction.deleteMany({ user: user._id }),
      BankAccount.deleteMany({ user: user._id }),
      Card.deleteMany({ user: user._id }),
      Recipient.deleteMany({ user: user._id }),
      Notification.deleteMany({ user: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    res.json({
      message: `${user.name} and all related data deleted`,
      adminBalance: admin.balance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/admin/reset-all
const resetAllBalances = async (req, res) => {
  try {
    const result = await User.updateMany({ role: "user" }, { $set: { balance: 0 } });
    res.json({
      message: `All user balances reset to \u20b90`,
      modified: result.modifiedCount,
      adminBalance: req.user.balance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/admin/refill
const refillAdminBalance = async (req, res) => {
  try {
    req.user.balance = ADMIN_BALANCE;
    await req.user.save();
    res.json({ adminBalance: req.user.balance, message: `Admin balance topped up to \u20b91,00,000` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  login,
  getMe,
  getStats,
  getUsers,
  getUser,
  sendMoney,
  deductMoney,
  createUser,
  toggleBlock,
  deleteUser,
  resetAllBalances,
  refillAdminBalance,
};
