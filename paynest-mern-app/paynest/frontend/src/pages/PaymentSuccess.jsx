import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { type, amount, transaction } = location.state || {};

  useEffect(() => {
    if (!transaction) {
      navigate("/dashboard", { replace: true });
    }
  }, [transaction, navigate]);

  if (!transaction) return null;

  const isAddMoney = type === "add_money";

  return (
    <div className="screen screen-centered no-nav-padding">
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "var(--success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 34px rgba(34,197,94,0.45)",
          marginBottom: 22,
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <CheckCircle2 size={54} color="#fff" strokeWidth={2} />
      </div>

      <h1 style={{ fontSize: 21 }}>Payment Successful! 🎉</h1>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 14 }}>{formatCurrency(amount)}</div>

      <div className="card mt-24" style={{ width: "100%", textAlign: "left" }}>
        <div className="flex-between" style={{ padding: "6px 0" }}>
          <span className="text-muted" style={{ fontSize: 13 }}>
            {isAddMoney ? "Added via" : "Paid to"}
          </span>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>{transaction.counterpartyName}</span>
        </div>
        <div className="flex-between" style={{ padding: "6px 0" }}>
          <span className="text-muted" style={{ fontSize: 13 }}>
            From
          </span>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{transaction.fromLabel}</span>
        </div>
        <div className="flex-between" style={{ padding: "6px 0" }}>
          <span className="text-muted" style={{ fontSize: 13 }}>
            Transaction ID
          </span>
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{transaction.transactionId}</span>
        </div>
      </div>

      <div className="flex-row gap-12 mt-24" style={{ width: "100%" }}>
        <button className="btn btn-secondary" onClick={() => navigate(`/transactions/${transaction._id}`)}>
          View Details
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/dashboard", { replace: true })}>
          Go to Home
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
