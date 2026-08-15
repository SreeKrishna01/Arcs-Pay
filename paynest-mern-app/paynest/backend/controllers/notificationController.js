const Notification = require("../models/Notification");

// @route GET /api/notifications
const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ notifications });
};

// @route PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
};

module.exports = { getNotifications, markRead, markAllRead };
