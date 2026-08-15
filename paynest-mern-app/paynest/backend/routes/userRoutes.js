const express = require("express");
const router = express.Router();
const { updateProfile, changePassword, setUpiPin, updateSettings } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.put("/me", updateProfile);
router.put("/me/password", changePassword);
router.put("/me/upi-pin", setUpiPin);
router.put("/me/settings", updateSettings);

module.exports = router;
