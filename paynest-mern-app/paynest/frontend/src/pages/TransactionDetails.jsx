import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import TopBar from "../components/TopBar";
import Spinner from "../components/Spinner";
import { transactionApi } from "../api/resources";
import { categoryColor, categoryInitial, formatCurrency, formatDateTime } from "../utils/format";

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionApi
      .get(id)
      .then(({ data }) => setTxn(data.transaction))
      .catch(() => setTxn(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="screen">
        <TopBar title="Transaction Details" right={<div style={{ width: 40 }} />} />
        <Spinner page />
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="screen">
        <TopBar title="Transaction Details" />
        <div className="empty-state">
          <p>Transaction not found.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/transactions")}>
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  const isCredit = txn.direction === "credit";

  const rows = [
    { label: "Status", value: txn.status === "success" ? "Completed" : txn.status, accent: "success" },
    { label: "Date & Time", value: formatDateTime(txn.createdAt) },
    { label: "Payment Method", value: txn.fromLabel || txn.method },
    { label: "Transaction ID", value: txn.transactionId },
    { label: "UPI ID", value: txn.counterpartyUpi || "—" },
  ];

  if (txn.note) {
    rows.splice(1, 0, { label: "Note", value: txn.note });
  }

  return (
    <div className="screen">
      <TopBar
        title="Transaction Details"
        right={
          <button className="icon-btn">
            <Share2 size={16} />
          </button>
        }
      />

      <div className="card" style={{ textAlign: "center", padding: 26 }}>
        <div
          className="row-icon"
          style={{
            width: 60,
            height: 60,
            fontSize: 20,
            margin: "0 auto 14px",
            background: categoryColor(txn.category),
          }}
        >
          {categoryInitial(txn.counterpartyName)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{txn.counterpartyName}</div>
        <div className={isCredit ? "text-success" : "text-danger"} style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>
          {isCredit ? "+ " : "- "}
          {formatCurrency(txn.amount)}
        </div>
        <div className="text-muted mt-8" style={{ fontSize: 12.5 }}>
          {isCredit ? "Received" : "Payment"}
        </div>
      </div>

      <div className="card mt-16">
        {rows.map((row) => (
          <div key={row.label} className="flex-between" style={{ padding: "10px 0" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {row.label}
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: row.accent === "success" ? "var(--success)" : "var(--text-primary)",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary mt-20" onClick={() => navigate("/help")}>
        Need Help?
      </button>
    </div>
  );
}
