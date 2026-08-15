import { useEffect, useState } from "react";
import { CheckCheck, ArrowDownCircle, CheckCircle2, Wallet, Gift, ShieldAlert } from "lucide-react";
import TopBar from "../components/TopBar";
import Spinner from "../components/Spinner";
import { notificationApi } from "../api/resources";
import { relativeDay, formatTime } from "../utils/format";

const ICONS = {
  payment_received: { icon: ArrowDownCircle, color: "#22c55e" },
  transaction_successful: { icon: CheckCircle2, color: "#8b5cf6" },
  add_money: { icon: Wallet, color: "#6366f1" },
  offer: { icon: Gift, color: "#f59e0b" },
  security: { icon: ShieldAlert, color: "#f43f5e" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationApi
      .list()
      .then(({ data }) => setNotifications(data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await notificationApi.markRead(id);
    } catch (err) {
      // non-critical
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationApi.markAllRead();
    } catch (err) {
      // non-critical
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="screen">
      <TopBar
        title="Notifications"
        right={
          hasUnread && (
            <button className="icon-btn" onClick={handleMarkAllRead} title="Mark all as read">
              <CheckCheck size={17} />
            </button>
          )
        }
      />

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontWeight: 600 }}>You're all caught up!</p>
          <p style={{ fontSize: 13 }}>No notifications yet.</p>
        </div>
      ) : (
        <div className="list-card">
          {notifications.map((n) => {
            const meta = ICONS[n.type] || ICONS.transaction_successful;
            const Icon = meta.icon;
            return (
              <button
                key={n._id}
                className="list-item"
                onClick={() => handleMarkRead(n._id)}
                style={{ alignItems: "flex-start", opacity: n.read ? 0.6 : 1 }}
              >
                <span className="list-item-icon" style={{ color: meta.color }}>
                  <Icon size={17} />
                </span>
                <span className="list-item-body">
                  <div className="flex-between">
                    <span>{n.title}</span>
                    {!n.read && <span className="badge-dot" style={{ marginLeft: 6 }} />}
                  </div>
                  <div className="list-item-sub">{n.message}</div>
                  <div className="list-item-sub" style={{ marginTop: 4 }}>
                    {relativeDay(n.createdAt)}, {formatTime(n.createdAt)}
                  </div>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
