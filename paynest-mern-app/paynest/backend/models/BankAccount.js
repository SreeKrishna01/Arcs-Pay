const mongoose = require("mongoose");

const BankAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true },
    accountNumber: { type: String, required: true }, // last 4 digits stored for display
    ifsc: { type: String },
    accountType: { type: String, enum: ["Savings", "Current"], default: "Savings" },
    isPrimary: { type: Boolean, default: false },
    icon: { type: String, default: "bank" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankAccount", BankAccountSchema);
