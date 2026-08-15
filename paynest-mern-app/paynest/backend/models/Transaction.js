const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    transactionId: { type: String, required: true, unique: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    type: {
      type: String,
      enum: ["sent", "received", "add_money", "bill", "subscription", "shopping", "other"],
      default: "other",
    },
    amount: { type: Number, required: true },
    counterpartyName: { type: String },
    counterpartyUpi: { type: String },
    category: { type: String, default: "Transfer" },
    note: { type: String, default: "" },
    method: { type: String, enum: ["UPI", "Card", "Net Banking", "Wallet"], default: "UPI" },
    status: { type: String, enum: ["success", "pending", "failed"], default: "success" },
    fromLabel: { type: String }, // e.g. bank account display used for this txn
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
