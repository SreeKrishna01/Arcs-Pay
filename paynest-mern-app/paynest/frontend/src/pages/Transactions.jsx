import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import TopBar from "../components/TopBar";
import TransactionRow from "../components/TransactionRow";
import Spinner from "../components/Spinner";
import { transactionApi } from "../api/resources";

const TABS = [
  { key: "all", label: "All" },
  { key: "received", label: "Received" },
  { key: "sent", label: "Sent" },
];

export default function Transactions() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      transactionApi
        .list({ filter: tab, search: search || undefined })
        .then(({ data }) => setTransactions(data.transactions))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [tab, search]);

  return (
    <div className="screen">
      <TopBar
        title="Transactions"
        showBack={false}
        right={
          <button className="icon-btn">
            <SlidersHorizontal size={17} />
          </button>
        }
      />

      <div className="input-wrap mb-16">
        <input
          className="input"
          placeholder="Search transactions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="input-suffix-btn" style={{ pointerEvents: "none" }}>
          <Search size={17} />
        </span>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontWeight: 600 }}>No transactions found</p>
            <p style={{ fontSize: 13 }}>Try a different search or filter.</p>
          </div>
        ) : (
          transactions.map((txn) => <TransactionRow key={txn._id} txn={txn} />)
        )}
      </div>
    </div>
  );
}
