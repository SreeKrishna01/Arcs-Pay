import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { formatCurrencyShort, categoryColor, categoryInitial, relativeDay, formatTime } from "../utils/format";

export default function TransactionRow({ txn, showChevron = true }) {
  const navigate = useNavigate();
  const isCredit = txn.direction === "credit";

  return (
    <button
      className="row"
      style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
      onClick={() => navigate(`/transactions/${txn._id}`)}
    >
      <div className="row-icon" style={{ background: categoryColor(txn.category) }}>
        {categoryInitial(txn.counterpartyName)}
      </div>
      <div className="row-body">
        <div className="row-title">{txn.counterpartyName}</div>
        <div className="row-subtitle">
          {relativeDay(txn.createdAt)}, {formatTime(txn.createdAt)}
        </div>
      </div>
      <div className={`row-amount ${isCredit ? "text-success" : "text-danger"}`}>
        {isCredit ? "+ " : "- "}
        {formatCurrencyShort(txn.amount)}
      </div>
      {showChevron && <ChevronRight size={16} className="row-chevron" />}
    </button>
  );
}
