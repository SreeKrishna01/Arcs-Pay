const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cardHolder: { type: String, required: true },
    cardNumber: { type: String, required: true }, // last 4 digits stored for display
    network: { type: String, enum: ["VISA", "MasterCard", "RuPay", "Amex"], default: "VISA" },
    expiry: { type: String, required: true }, // MM/YY
    color: { type: String, default: "#5B21B6" },
    frozen: { type: Boolean, default: false },
    spendingLimit: { type: Number, default: 50000 },
    linkedAccount: { type: mongoose.Schema.Types.ObjectId, ref: "BankAccount" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
