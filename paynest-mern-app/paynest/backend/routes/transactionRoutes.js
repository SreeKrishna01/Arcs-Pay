const express = require("express");
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  sendMoney,
  addMoney,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.post("/send", sendMoney);
router.post("/add-money", addMoney);

module.exports = router;
