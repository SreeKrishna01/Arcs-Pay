import { useEffect, useState } from "react";
import { Plus, Snowflake, SlidersHorizontal, KeyRound, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import Switch from "../components/Switch";
import BottomSheet from "../components/BottomSheet";
import Spinner from "../components/Spinner";
import TransactionRow from "../components/TransactionRow";
import { cardApi, transactionApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function MyCards() {
  const toast = useToast();
  const { user } = useAuth();

  const [cards, setCards] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [limitInput, setLimitInput] = useState("");
  const [newCard, setNewCard] = useState({ cardHolder: user?.name || "", cardNumber: "", expiry: "", network: "VISA" });

  const loadCards = () => {
    cardApi
      .list()
      .then(({ data }) => setCards(data.cards))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCards();
    transactionApi
      .list({})
      .then(({ data }) => setPayments(data.transactions.filter((t) => t.method === "Card").slice(0, 4)))
      .catch(() => {});
  }, []);

  const activeCard = cards[activeIndex];

  const handleFreeze = async () => {
    if (!activeCard) return;
    try {
      const { data } = await cardApi.toggleFreeze(activeCard._id);
      setCards((prev) => prev.map((c) => (c._id === data.card._id ? data.card : c)));
      toast.success(data.card.frozen ? "Card frozen" : "Card unfrozen");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSetLimit = async () => {
    const value = Number(limitInput);
    if (!value || value <= 0) {
      toast.error("Enter a valid limit");
      return;
    }
    try {
      const { data } = await cardApi.updateLimit(activeCard._id, { spendingLimit: value });
      setCards((prev) => prev.map((c) => (c._id === data.card._id ? data.card : c)));
      toast.success("Spending limit updated");
      setShowLimit(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.cardHolder || !newCard.cardNumber || !newCard.expiry) {
      toast.error("Fill in all card details");
      return;
    }
    try {
      const colors = ["#5B21B6", "#0F766E", "#9D174D", "#1D4ED8"];
      const { data } = await cardApi.create({
        ...newCard,
        color: colors[cards.length % colors.length],
      });
      setCards((prev) => [data.card, ...prev]);
      setShowAdd(false);
      setNewCard({ cardHolder: user?.name || "", cardNumber: "", expiry: "", network: "VISA" });
      toast.success("Card added");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="screen">
      <TopBar
        title="My Cards"
        showBack={false}
        right={
          <button className="icon-btn" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
          </button>
        }
      />

      {loading ? (
        <Spinner />
      ) : cards.length === 0 ? (
        <div className="card empty-state">
          <p style={{ fontWeight: 600 }}>No cards yet</p>
          <p style={{ fontSize: 13 }}>Add a debit or credit card to get started.</p>
          <button className="btn btn-primary btn-sm mt-12" onClick={() => setShowAdd(true)}>
            Add Card
          </button>
        </div>
      ) : (
        <>
          <div className="chip-row mb-16" style={{ gap: 14, paddingBottom: 6 }}>
            {cards.map((card, i) => (
              <div
                key={card._id}
                onClick={() => setActiveIndex(i)}
                style={{
                  flexShrink: 0,
                  width: 300,
                  height: 178,
                  borderRadius: 22,
                  padding: 22,
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
                  color: "#fff",
                  position: "relative",
                  overflow: "hidden",
                  opacity: i === activeIndex ? 1 : 0.55,
                  border: i === activeIndex ? "2px solid rgba(255,255,255,0.4)" : "2px solid transparent",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    top: -60,
                    right: -50,
                  }}
                />
                <div className="flex-between">
                  <span style={{ fontWeight: 700, fontSize: 15 }}>
                    {card.frozen ? "Frozen" : "Arcs Pay"}
                  </span>
                  <span style={{ fontWeight: 800, fontStyle: "italic", fontSize: 17 }}>{card.network}</span>
                </div>
                <div>
                  <div style={{ fontSize: 17, letterSpacing: 2, fontWeight: 600 }}>
                    •••• •••• •••• {card.cardNumber}
                  </div>
                  <div className="flex-between mt-8" style={{ fontSize: 12 }}>
                    <span>{card.cardHolder}</span>
                    <span>{card.expiry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary mb-20" disabled>
            View Card Details
          </button>

          <div className="section-title">Card Controls</div>
          <div className="list-card mb-20">
            <div className="list-item">
              <span className="list-item-icon">
                <Snowflake size={16} />
              </span>
              <span className="list-item-body">
                Freeze Card
                <div className="list-item-sub">
                  {activeCard?.frozen ? "Card is currently frozen" : "Use fingerprint to login"}
                </div>
              </span>
              <Switch on={!!activeCard?.frozen} onToggle={handleFreeze} />
            </div>
            <button
              className="list-item"
              onClick={() => {
                setLimitInput(String(activeCard?.spendingLimit || ""));
                setShowLimit(true);
              }}
            >
              <span className="list-item-icon">
                <SlidersHorizontal size={16} />
              </span>
              <span className="list-item-body">
                Set Limit
                <div className="list-item-sub">
                  ₹{(activeCard?.spendingLimit || 0).toLocaleString("en-IN")} / month
                </div>
              </span>
              <ChevronRight size={16} className="row-chevron" />
            </button>
            <button className="list-item" disabled>
              <span className="list-item-icon">
                <KeyRound size={16} />
              </span>
              <span className="list-item-body">Manage PIN</span>
              <ChevronRight size={16} className="row-chevron" />
            </button>
          </div>
        </>
      )}

      <div className="section-title">Recent Payments</div>
      <div className="card">
        {payments.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13 }}>
            No card payments yet.
          </p>
        ) : (
          payments.map((p) => <TransactionRow key={p._id} txn={p} showChevron={false} />)
        )}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add a Card">
        <form onSubmit={handleAddCard}>
          <div className="field">
            <label>Card Holder Name</label>
            <input
              className="input"
              value={newCard.cardHolder}
              onChange={(e) => setNewCard((c) => ({ ...c, cardHolder: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Card Number</label>
            <input
              className="input"
              placeholder="XXXX XXXX XXXX XXXX"
              value={newCard.cardNumber}
              onChange={(e) => setNewCard((c) => ({ ...c, cardNumber: e.target.value.replace(/[^0-9]/g, "") }))}
              maxLength={16}
              inputMode="numeric"
            />
          </div>
          <div className="flex-row gap-12">
            <div className="field" style={{ flex: 1 }}>
              <label>Expiry (MM/YY)</label>
              <input
                className="input"
                placeholder="09/27"
                value={newCard.expiry}
                onChange={(e) => setNewCard((c) => ({ ...c, expiry: e.target.value }))}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Network</label>
              <select
                className="select"
                value={newCard.network}
                onChange={(e) => setNewCard((c) => ({ ...c, network: e.target.value }))}
              >
                <option>VISA</option>
                <option>MasterCard</option>
                <option>RuPay</option>
                <option>Amex</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-8" type="submit">
            Add Card
          </button>
        </form>
      </BottomSheet>

      <BottomSheet open={showLimit} onClose={() => setShowLimit(false)} title="Set Spending Limit">
        <div className="field">
          <label>Monthly Limit (₹)</label>
          <input
            className="input"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
          />
        </div>
        <button className="btn btn-primary" onClick={handleSetLimit}>
          Save Limit
        </button>
      </BottomSheet>
    </div>
  );
}
