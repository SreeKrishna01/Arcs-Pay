const express = require("express");
const router = express.Router();
const { getRecipients, createRecipient, toggleFavorite, deleteRecipient } = require("../controllers/recipientController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getRecipients);
router.post("/", createRecipient);
router.put("/:id/favorite", toggleFavorite);
router.delete("/:id", deleteRecipient);

module.exports = router;
