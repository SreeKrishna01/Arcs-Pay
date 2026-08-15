import { useMemo, useState } from "react";
import { Search, MessageCircle, ChevronDown, Mail, Phone } from "lucide-react";
import TopBar from "../components/TopBar";
import { useToast } from "../context/ToastContext";

const FAQS = [
  {
    q: "How do I add money to my wallet?",
    a: "Go to Home → Add Money, enter the amount, choose a linked bank account, and tap Add Money. Funds reflect instantly in your Arcs Pay balance.",
  },
  {
    q: "How do I send money to someone?",
    a: "Tap Send Money on the Home screen, search for a contact or enter their UPI ID, enter the amount, and confirm with your UPI PIN.",
  },
  {
    q: "I'm having UPI PIN related issues",
    a: "You can reset your UPI PIN anytime from Profile → Security → UPI PIN. If you've forgotten your PIN, resetting it does not require the old PIN on first setup.",
  },
  {
    q: "Transaction failed but amount was debited?",
    a: "This can happen due to a network delay. Failed transactions are usually auto-reversed within a few minutes. Check Transactions for the latest status, and contact support if it isn't reversed within 24 hours.",
  },
  {
    q: "How do I freeze or unfreeze my card?",
    a: "Go to Cards, select the card, and toggle Freeze Card under Card Controls. A frozen card blocks all new transactions until unfrozen.",
  },
  {
    q: "Is my money safe with Arcs Pay?",
    a: "Yes. Arcs Pay uses bank-grade encryption and never stores your UPI PIN or password in plain text. You can also enable Two-step Verification in Security settings.",
  },
];

export default function HelpSupport() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return FAQS;
    const q = search.toLowerCase();
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="screen">
      <TopBar title="Help & Support" />

      <p className="text-secondary mb-16" style={{ fontSize: 14, fontWeight: 600 }}>
        How can we help you?
      </p>

      <div className="input-wrap mb-20">
        <input
          className="input"
          placeholder="Search for help topics"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="input-suffix-btn" style={{ pointerEvents: "none" }}>
          <Search size={17} />
        </span>
      </div>

      <div className="section-title">Popular Topics</div>
      <div className="list-card mb-20">
        {filtered.length === 0 ? (
          <p className="text-muted" style={{ padding: 16, fontSize: 13 }}>
            No topics match your search.
          </p>
        ) : (
          filtered.map((faq, i) => (
            <div key={faq.q}>
              <button
                className="list-item"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="list-item-body" style={{ fontWeight: 600 }}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={16}
                  className="row-chevron"
                  style={{
                    transform: openIndex === i ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                />
              </button>
              {openIndex === i && (
                <div style={{ padding: "0 18px 16px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="section-title">Contact Us</div>
      <div className="list-card mb-20">
        <button className="list-item" onClick={() => toast.info("support@arcspay.app")}>
          <span className="list-item-icon">
            <Mail size={16} />
          </span>
          <span className="list-item-body">Email Support</span>
        </button>
        <button className="list-item" onClick={() => toast.info("1800-123-4567 (toll free)")}>
          <span className="list-item-icon">
            <Phone size={16} />
          </span>
          <span className="list-item-body">Call Support</span>
        </button>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => toast.success("A support agent will be with you shortly!")}
      >
        <MessageCircle size={17} />
        Chat with Support
      </button>
      <p className="text-muted mt-8" style={{ textAlign: "center", fontSize: 12 }}>
        We typically reply in a few minutes
      </p>
    </div>
  );
}
