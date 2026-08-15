import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function TopBar({ title, onBack, backTo, right = null, showBack = true }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return navigate(backTo);
    navigate(-1);
  };

  return (
    <div className="top-bar">
      <img className="app-logo" src="/logo.png" alt="Arcs Pay" />
      {showBack ? (
        <button className="icon-btn" onClick={handleBack} aria-label="Go back">
          <ChevronLeft size={20} />
        </button>
      ) : (
        <div style={{ width: 40 }} />
      )}
      <h1>{title}</h1>
      <div className="top-bar-spacer" />
      {right}
    </div>
  );
}
