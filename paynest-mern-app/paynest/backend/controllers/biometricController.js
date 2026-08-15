const jwt = require("jsonwebtoken");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const RP_NAME = process.env.WEB_AUTHN_RP_NAME || "Arcs Pay";
const RP_ID = process.env.WEB_AUTHN_RP_ID || "localhost";
const EXPECTED_ORIGINS = (process.env.WEB_AUTHN_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

// @route POST /api/biometric/register-options
const generateRegisterOptions = async (req, res) => {
  try {
    const user = req.user;

    if (!user.upiPin) {
      return res
        .status(400)
        .json({ message: "Please set up your UPI PIN before enabling fingerprint payments" });
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.mobile,
      userDisplayName: user.name,
      userID: user._id.toBuffer(),
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      excludeCredentials: user.credentials.map((c) => ({
        id: c.credentialId.toString("base64url"),
        type: "public-key",
      })),
      timeout: 60000,
    });

    user.webAuthnChallenge = options.challenge;
    await user.save();

    res.json({ options });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/biometric/register-verify
const verifyRegistration = async (req, res) => {
  try {
    const user = req.user;
    const { response, deviceName } = req.body;

    if (!response) {
      return res.status(400).json({ message: "Missing registration response" });
    }
    if (!user.webAuthnChallenge) {
      return res.status(400).json({ message: "No active registration request" });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.webAuthnChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
    });

    if (!verification.verified) {
      return res.status(400).json({ message: "Fingerprint registration failed" });
    }

    const { registrationInfo } = verification;
    const { credential } = registrationInfo;

    user.credentials.push({
      credentialId: Buffer.from(credential.id, "base64url"),
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports || [],
      deviceName: deviceName || "Your device",
    });
    user.webAuthnChallenge = null;
    user.settings.fingerprintEnabled = true;
    await user.save();

    res.json({ user: user.toSafeObject(), settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/biometric/assertion-options
const generateAssertionOptions = async (req, res) => {
  try {
    const user = req.user;

    if (user.credentials.length === 0) {
      return res.status(400).json({ message: "Fingerprint not set up. Enable it in Settings first" });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.credentials.map((c) => ({
        id: c.credentialId.toString("base64url"),
        type: "public-key",
        transports: c.transports || [],
      })),
      userVerification: "required",
      timeout: 60000,
    });

    user.webAuthnChallenge = options.challenge;
    await user.save();

    res.json({ options });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/biometric/assertion-verify
const verifyAssertion = async (req, res) => {
  try {
    const user = req.user;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ message: "Missing verification response" });
    }
    if (!user.webAuthnChallenge) {
      return res.status(400).json({ message: "No active verification request" });
    }

    const credential = user.credentials.find(
      (c) => c.credentialId.toString("base64url") === response.id
    );
    if (!credential) {
      return res.status(400).json({ message: "Credential not found" });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.webAuthnChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: credential.credentialId.toString("base64url"),
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports || [],
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ message: "Fingerprint verification failed" });
    }

    credential.counter = verification.authenticationInfo.newCounter;
    user.webAuthnChallenge = null;
    await user.save();

    const fingerprintToken = jwt.sign(
      { sub: user._id.toString(), purpose: "payment" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.json({ verified: true, fingerprintToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/biometric/credentials
const removeCredentials = async (req, res) => {
  try {
    const user = req.user;
    user.credentials = [];
    user.webAuthnChallenge = null;
    user.settings.fingerprintEnabled = false;
    await user.save();

    res.json({ user: user.toSafeObject(), settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  generateRegisterOptions,
  verifyRegistration,
  generateAssertionOptions,
  verifyAssertion,
  removeCredentials,
};
