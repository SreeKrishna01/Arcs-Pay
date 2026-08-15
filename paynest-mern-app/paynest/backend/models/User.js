const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const CredentialSchema = new mongoose.Schema(
  {
    credentialId: { type: Buffer, required: true },
    publicKey: { type: Buffer, required: true },
    counter: { type: Number, default: 0 },
    transports: { type: [String], default: [] },
    deviceName: { type: String, default: "Your device" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    upiId: { type: String, unique: true },
    upiPin: { type: String, default: null },
    avatarColor: { type: String, default: "#8B5CF6" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    balance: { type: Number, default: 0 },
    credentials: { type: [CredentialSchema], default: [] },
    webAuthnChallenge: { type: String, default: null },
    settings: {
      theme: { type: String, default: "light" },
      language: { type: String, default: "English" },
      notificationsEnabled: { type: Boolean, default: true },
      biometricLogin: { type: Boolean, default: true },
      twoStepVerification: { type: Boolean, default: true },
      fingerprintEnabled: { type: Boolean, default: false },
      paymentMethod: { type: String, enum: ["pin", "fingerprint"], default: "pin" },
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.setUpiPin = async function (pin) {
  const salt = await bcrypt.genSalt(10);
  this.upiPin = await bcrypt.hash(pin, salt);
};

UserSchema.methods.matchUpiPin = async function (enteredPin) {
  if (!this.upiPin) return false;
  return bcrypt.compare(enteredPin, this.upiPin);
};

UserSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    upiId: this.upiId,
    avatarColor: this.avatarColor,
    role: this.role,
    isActive: this.isActive,
    balance: this.balance,
    settings: this.settings,
    hasUpiPin: !!this.upiPin,
    hasFingerprint: this.credentials.length > 0,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", UserSchema);
