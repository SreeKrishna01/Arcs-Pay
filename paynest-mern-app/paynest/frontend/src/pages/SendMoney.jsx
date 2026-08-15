import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Send } from "lucide-react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import { recipientApi } from "../api/resources";
import { useToast } from "../context/ToastContext";

export default function SendMoney() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [recipients, setRecipients] = useState([]);
  const [search, setSearch] = useState(location.state?.prefillUpi || "");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipientApi
      .list()
      .then(({ data }) => setRecipients(data.recipients))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return recipients;
    const q = search.toLowerCase();
    return recipients.filter(
      (r) => r.name.toLowerCase().includes(q) || r.upiId.toLowerCase().includes(q)
    );
  }, [recipients, search]);

  const frequentlyUsed = recipients.filter((r) => r.favorite).slice(0, 6);

  const looksLikeUpi = search.includes("@") && search.length > 3;
  const showManualPay = looksLikeUpi && filtered.length === 0;

  const handleContinue = () => {
    if (!selected) {
      toast.error("Select a recipient to continue");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    navigate("/confirm-pay", {
      state: { recipient: selected, amount: numAmount, note },
    });
  };

  return (
    <div className="screen">
      <TopBar title="Send Money" />

      <label className="text-secondary" style={{ fontSize: 13, fontWeight: 600 }}>
        To
      </label>
      <div className="input-wrap mt-8 mb-16">
        <input
          className="input"
          placeholder="Search by name, phone or UPI ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="input-suffix-btn" style={{ pointerEvents: "none" }}>
          <Search size={17} />
        </span>
      </div>

      {showManualPay && (
        <button
          className="card mb-16"
          style={{ width: "100%", textAlign: "left", border: "1px solid var(--accent-violet)" }}
          onClick={() =>
            setSelected({ _id: "manual", name: search.split("@")[0], upiId: search, avatarColor: "#8B5CF6" })
          }
        >
          <div className="flex-row gap-12">
            <Avatar name={search.split("@")[0]} size={38} />
            <div>
              <div className="row-title">Pay to {search}</div>
              <div className="row-subtitle">New UPI ID</div>
            </div>
          </div>
        </button>
      )}

      {!search && frequentlyUsed.length > 0 && (
        <>
          <div className="flex-between mb-12">
            <span className="section-title" style={{ marginBottom: 0 }}>
              Recent Contacts
            </span>
            <span className="view-all" onClick={() => navigate("/recipients")}>
              View All
            </span>
          </div>
          <div className="chip-row mb-20" style={{ gap: 16 }}>
            {frequentlyUsed.map((r) => (
              <button
                key={r._id}
                onClick={() => setSelected(r)}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    borderRadius: "50%",
                    padding: selected?._id === r._id ? 2 : 0,
                    background: selected?._id === r._id ? "var(--gradient-brand)" : "none",
                  }}
                >
                  <Avatar name={r.name} color={r.avatarColor} size={52} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{r.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="section-title">All Contacts</div>
      <div className="list-card mb-20">
        {loading ? (
          <p className="text-muted" style={{ padding: 16, fontSize: 13 }}>
            Loading contacts...
          </p>
        ) : filtered.length === 0 && !showManualPay ? (
          <p className="text-muted" style={{ padding: 16, fontSize: 13 }}>
            No contacts found.
          </p>
        ) : (
          filtered.map((r) => (
            <button
              key={r._id}
              className="list-item"
              onClick={() => setSelected(r)}
              style={{ background: selected?._id === r._id ? "var(--bg-card-alt)" : "none" }}
            >
              <Avatar name={r.name} color={r.avatarColor} size={36} />
              <span className="list-item-body">
                {r.name}
                <div className="list-item-sub">{r.upiId}</div>
              </span>
            </button>
          ))
        )}
      </div>

      {selected && (
        <>
          <div className="card mb-16" style={{ borderColor: "var(--accent-violet)" }}>
            <div className="flex-row gap-12">
              <Avatar name={selected.name} color={selected.avatarColor} size={40} />
              <div>
                <div className="row-title">{selected.name}</div>
                <div className="row-subtitle">{selected.upiId}</div>
              </div>
            </div>
          </div>

          <label className="text-secondary" style={{ fontSize: 13, fontWeight: 600 }}>
            Enter Amount
          </label>
          <div className="flex-row" style={{ margin: "8px 0 16px" }}>
            <span style={{ fontSize: 28, fontWeight: 800, marginRight: 6 }}>₹</span>
            <input
              className="input"
              style={{ border: "none", background: "none", fontSize: 28, fontWeight: 800, padding: 0 }}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
            />
          </div>

          <div className="field">
            <input
              className="input"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button className="btn btn-primary mt-8" onClick={handleContinue}>
            <Send size={16} /> Continue
          </button>
        </>
      )}
    </div>
  );
}
