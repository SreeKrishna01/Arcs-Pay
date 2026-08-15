import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Download, QrCode, Grid2x2, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { transactionApi, notificationApi } from "../api/resources";
import { formatCurrency } from "../utils/format";
import TransactionRow from "../components/TransactionRow";
import Spinner from "../components/Spinner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [timeGreeting, setTimeGreeting] = useState(greeting());

  useEffect(() => {
    const id = setInterval(() => setTimeGreeting(greeting()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    refreshUser();
    const load = async () => {
      try {
        const [{ data: txnData }, { data: notifData }] = await Promise.all([
          transactionApi.list({}),
          notificationApi.list(),
        ]);
        setTransactions(txnData.transactions.slice(0, 5));
        setUnread(notifData.notifications.filter((n) => !n.read).length);
      } catch (err) {
        // fail silently on dashboard, handled by empty state
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="screen">
      <div className="flex-between mb-16">
        <div className="flex-row" style={{ alignItems: "center", gap: 12 }}>
          <img className="app-logo" src="/logo.png" alt="Arcs Pay" />
          <div>
            <h1 style={{ fontSize: 19 }}>Hello, {firstName}</h1>
            <p className="text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              Good {timeGreeting}
            </p>
          </div>
        </div>
        <button className="icon-btn" style={{ position: "relative" }} onClick={() => navigate("/notifications")}>
          <Bell size={19} />
          {unread > 0 && (
            <span
              className="badge-dot"
              style={{ position: "absolute", top: 8, right: 9 }}
            />
          )}
        </button>
      </div>

      <div className="balance-card">
        <div className="balance-label">Total Balance</div>
        <div className="balance-amount">{formatCurrency(user?.balance ?? 0)}</div>
        <span className="balance-details-link" onClick={() => navigate("/transactions")}>
          View Details <ChevronRight size={14} />
        </span>
      </div>

      <div className="quick-actions">
        <button className="quick-action" onClick={() => navigate("/send-money")}>
          <span className="quick-action-icon">
            <Send size={20} />
          </span>
          <span>Send Money</span>
        </button>
        <button className="quick-action" onClick={() => navigate("/add-money")}>
          <span className="quick-action-icon">
            <Download size={20} />
          </span>
          <span>Add Money</span>
        </button>
        <button className="quick-action" onClick={() => navigate("/scan")}>
          <span className="quick-action-icon">
            <QrCode size={20} />
          </span>
          <span>Scan &amp; Pay</span>
        </button>
        <button className="quick-action" onClick={() => navigate("/profile")}>
          <span className="quick-action-icon">
            <Grid2x2 size={20} />
          </span>
          <span>More</span>
        </button>
      </div>

      <div className="card">
        <div className="section-title">
          Recent Transactions
          <span className="view-all" onClick={() => navigate("/transactions")}>
            View All
          </span>
        </div>

        {loading ? (
          <Spinner />
        ) : transactions.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13, padding: "12px 0" }}>
            No transactions yet. Add money to get started!
          </p>
        ) : (
          transactions.map((txn) => <TransactionRow key={txn._id} txn={txn} showChevron={false} />)
        )}
      </div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}
