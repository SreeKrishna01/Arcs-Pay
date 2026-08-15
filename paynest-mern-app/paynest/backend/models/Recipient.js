const mongoose = require("mongoose");

const RecipientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    upiId: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    avatarColor: { type: String, default: "#8B5CF6" },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipient", RecipientSchema);
