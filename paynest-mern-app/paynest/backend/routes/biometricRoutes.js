const express = require("express");
const router = express.Router();
const {
  generateRegisterOptions,
  verifyRegistration,
  generateAssertionOptions,
  verifyAssertion,
  removeCredentials,
} = require("../controllers/biometricController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/register-options", generateRegisterOptions);
router.post("/register-verify", verifyRegistration);
router.post("/assertion-options", generateAssertionOptions);
router.post("/assertion-verify", verifyAssertion);
router.delete("/credentials", removeCredentials);

module.exports = router;
