import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Receipt, QrCode, CreditCard, User } from "lucide-react";

const items = [
  { key: "home", label: "Home", path: "/dashboard", icon: Home },
  { key: "transactions", label: "Transactions", path: "/transactions", icon: Receipt },
  { key: "scan", label: "", path: "/scan", icon: QrCode, fab: true },
  { key: "cards", label: "Cards", path: "/cards", icon: CreditCard },
  { key: "profile", label: "Profile", path: "/profile", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [floatKey, setFloatKey] = useState(null);
  const [floatTick, setFloatTick] = useState(0);

  const handleClick = (item) => {
    setFloatKey(item.key);
    setFloatTick((t) => t + 1);
    navigate(item.path);
  };

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        const animate = floatKey === item.key ? floatTick : 0;

        if (item.fab) {
          return (
            <button
              key={item.key}
              className="nav-item"
              onClick={() => handleClick(item)}
              aria-label="Scan QR"
            >
              <span key={animate} className={`nav-item-fab ${animate ? "nav-item-float" : ""}`}>
                <Icon size={22} />
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.key}
            className={`nav-item ${active ? "active" : ""}`}
            onClick={() => handleClick(item)}
          >
            <span key={animate} className={animate ? "nav-item-float" : ""}>
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
