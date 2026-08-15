const express = require("express");
const router = express.Router();
const { getCards, createCard, toggleFreeze, updateLimit, deleteCard } = require("../controllers/cardController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getCards);
router.post("/", createCard);
router.put("/:id/freeze", toggleFreeze);
router.put("/:id/limit", updateLimit);
router.delete("/:id", deleteCard);

module.exports = router;
