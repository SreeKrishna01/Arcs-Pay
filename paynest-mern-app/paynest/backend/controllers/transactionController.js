const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const BankAccount = require("../models/BankAccount");
const Notification = require("../models/Notification");

const generateTxnId = () => {
  const digits = Math.floor(100000000000 + Math.random() * 899999999999);
  return `UPI${digits}`;
};

// @route GET /api/transactions?filter=all|sent|received&search=
const getTransactions = async (req, res) => {
  try {
    const { filter, search } = req.query;
    const query = { user: req.user._id };

    if (filter === "sent") query.direction = "debit";
    if (filter === "received") query.direction = "credit";

    if (search) {
      query.$or = [
        { counterpartyName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).limit(200);
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/transactions/:id
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/transactions/send
const sendMoney = async (req, res) => {
  try {
    const {
      name,
      upiId,
      amount,
      note,
      pin,
      fromLabel,
      fingerprintToken,
    } = req.body;

    const sender = req.user;

    if (!name || !upiId || !amount) {
      return res.status(400).json({
        message: "Recipient and amount are required",
      });
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        message: "Enter a valid amount",
      });
    }

    // Verify payment
    if (!sender.upiPin && !fingerprintToken) {
      return res.status(400).json({
        message: "Please set up your UPI PIN or fingerprint first",
      });
    }

    let authorizedByFingerprint = false;

    if (pin) {
      const validPin = await sender.matchUpiPin(pin);

      if (!validPin) {
        return res.status(400).json({
          message: "Incorrect UPI PIN",
        });
      }
    } else if (fingerprintToken) {
      try {
        const decoded = jwt.verify(
          fingerprintToken,
          process.env.JWT_SECRET
        );

        if (
          decoded.sub !== sender._id.toString() ||
          decoded.purpose !== "payment"
        ) {
          return res.status(400).json({
            message: "Invalid fingerprint verification",
          });
        }

        authorizedByFingerprint = true;
      } catch (err) {
        return res.status(400).json({
          message: "Fingerprint verification expired. Please try again.",
        });
      }
    } else {
      return res.status(400).json({
        message: "Please enter your UPI PIN",
      });
    }

    // Check sender balance
    if (numericAmount > sender.balance) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Find receiver
    const receiver = await User.findOne({
      upiId: upiId.trim().toLowerCase(),
      role: "user",
    });

    if (!receiver) {
      return res.status(404).json({
        message: "Recipient not found",
      });
    }

    if (receiver._id.toString() === sender._id.toString()) {
      return res.status(400).json({
        message: "You cannot send money to yourself",
      });
    }

    if (!receiver.isActive) {
      return res.status(400).json({
        message: "Recipient account is blocked",
      });
    }

    // Generate different transaction IDs
    const senderTxnId = generateTxnId();
    const receiverTxnId = generateTxnId();

    // Update balances
    sender.balance -= numericAmount;
    receiver.balance += numericAmount;

    await sender.save();
    await receiver.save();

    // Create sender transaction
    const senderTransaction = await Transaction.create({
      user: sender._id,
      transactionId: senderTxnId,
      direction: "debit",
      type: "sent",
      amount: numericAmount,
      counterpartyName: receiver.name,
      counterpartyUpi: receiver.upiId,
      category: "Transfer",
      note: note || "",
      method: authorizedByFingerprint ? "Fingerprint" : "UPI",
      status: "success",
      fromLabel: fromLabel || "Arcs Pay Wallet",
    });

    // Create receiver transaction
    const receiverTransaction = await Transaction.create({
      user: receiver._id,
      transactionId: receiverTxnId,
      direction: "credit",
      type: "received",
      amount: numericAmount,
      counterpartyName: sender.name,
      counterpartyUpi: sender.upiId,
      category: "Transfer",
      note: note || "",
      method: authorizedByFingerprint ? "Fingerprint" : "UPI",
      status: "success",
      fromLabel: sender.name,
    });

    // Sender notification
    await Notification.create({
      user: sender._id,
      title: "Transaction Successful",
      message: `Paid ₹${numericAmount.toLocaleString(
        "en-IN"
      )} to ${receiver.name}`,
      type: "transaction_successful",
    });

    // Receiver notification
    await Notification.create({
      user: receiver._id,
      title: "Money Received",
      message: `₹${numericAmount.toLocaleString(
        "en-IN"
      )} received from ${sender.name}`,
      type: "payment_received",
    });

    return res.status(201).json({
      transaction: senderTransaction,
      receiverTransaction,
      balance: sender.balance,
      receiver: {
        name: receiver.name,
        upiId: receiver.upiId,
      },
      message: `₹${numericAmount.toLocaleString(
        "en-IN"
      )} sent successfully`,
    });

  } catch (err) {
    console.error("Send money error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};
// @route POST /api/transactions/add-money
const addMoney = async (req, res) => {
  try {
    const { amount, accountId } = req.body;
    const user = req.user;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid amount" });
    }

    let fromLabel = "Bank Account";
    if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      const account = await BankAccount.findOne({ _id: accountId, user: user._id });
      if (account) fromLabel = `${account.bankName} \u2022\u2022\u2022\u2022 ${account.accountNumber}`;
    }

    user.balance += numericAmount;
    await user.save();

    const transaction = await Transaction.create({
      user: user._id,
      transactionId: generateTxnId(),
      direction: "credit",
      type: "add_money",
      amount: numericAmount,
      counterpartyName: fromLabel,
      category: "Add Money",
      method: "UPI",
      status: "success",
      fromLabel,
    });

    await Notification.create({
      user: user._id,
      title: "Add Money Successful",
      message: `\u20b9${numericAmount.toLocaleString("en-IN")} added to your wallet`,
      type: "add_money",
    });

    res.status(201).json({ transaction, balance: user.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTransactions, getTransactionById, sendMoney, addMoney };
