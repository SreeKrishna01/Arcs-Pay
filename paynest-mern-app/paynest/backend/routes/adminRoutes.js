const express = require("express");
const router = express.Router();
const { protect, adminProtect } = require("../middleware/auth");
const admin = require("../controllers/adminController");

router.post("/login", admin.login);
router.get("/me", protect, adminProtect, admin.getMe);
router.get("/stats", protect, adminProtect, admin.getStats);
router.get("/users", protect, adminProtect, admin.getUsers);
router.get("/users/:id", protect, adminProtect, admin.getUser);
router.post("/users", protect, adminProtect, admin.createUser);
router.post("/users/:id/send", protect, adminProtect, admin.sendMoney);
router.post("/users/:id/deduct", protect, adminProtect, admin.deductMoney);
router.post("/users/:id/toggle-block", protect, adminProtect, admin.toggleBlock);
router.delete("/users/:id", protect, adminProtect, admin.deleteUser);
router.post("/reset-all", protect, adminProtect, admin.resetAllBalances);
router.post("/refill", protect, adminProtect, admin.refillAdminBalance);

module.exports = router;
