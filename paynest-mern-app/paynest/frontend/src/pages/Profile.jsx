import { useNavigate } from "react-router-dom";
import {
  User,
  Landmark,
  Fingerprint,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { icon: User, label: "Personal Details", path: "/profile/details" },
  { icon: Landmark, label: "Bank Accounts", path: "/bank-accounts" },
  { icon: Fingerprint, label: "UPI IDs", path: "/profile/details" },
  { icon: Shield, label: "Security", path: "/security" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="screen">
      <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Avatar name={user?.name || ""} color={user?.avatarColor} size={72} fontSize={26} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
        <div className="text-muted mt-8" style={{ fontSize: 13 }}>
          {user?.email || "No email added"}
        </div>
        <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
          +91 {user?.mobile}
        </div>
      </div>

      <div className="list-card mt-20">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className="list-item" onClick={() => navigate(item.path)}>
              <span className="list-item-icon">
                <Icon size={16} />
              </span>
              <span className="list-item-body">{item.label}</span>
              <ChevronRight size={16} className="row-chevron" />
            </button>
          );
        })}
      </div>

      <div className="list-card mt-16">
        <button className="list-item danger" onClick={handleLogout}>
          <span className="list-item-icon">
            <LogOut size={16} />
          </span>
          <span className="list-item-body">Logout</span>
        </button>
      </div>

      <p className="text-muted mt-24" style={{ textAlign: "center", fontSize: 11.5 }}>
        Arcs Pay v1.0.0
      </p>
    </div>
  );
}
