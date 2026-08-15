const express = require("express");
const router = express.Router();
const { getAccounts, createAccount, setPrimary, deleteAccount } = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getAccounts);
router.post("/", createAccount);
router.put("/:id/primary", setPrimary);
router.delete("/:id", deleteAccount);

module.exports = router;
