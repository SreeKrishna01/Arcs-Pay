import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicShell from "../components/PublicShell";
import { useAuth } from "../context/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? "/dashboard" : "/onboarding", { replace: true });
    }, 1400);
    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, navigate]);

  return (
    <PublicShell>
      <div className="screen screen-centered no-nav-padding">
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            background: "var(--gradient-brand)",
            overflow: "hidden",
            boxShadow: "var(--shadow-glow)",
            marginBottom: 24,
          }}
        >
          <img
            src="/logo.png"
            alt="Arcs Pay"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Arcs Pay</h1>
        <p className="text-secondary mt-8" style={{ fontSize: 14.5 }}>
          Secure. Fast. Easy.
        </p>

        <div
          style={{
            position: "absolute",
            bottom: 60,
            width: 120,
            height: 4,
            borderRadius: 4,
            background: "var(--border-strong)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              background: "var(--gradient-brand)",
              animation: "loadBar 1.4s ease-in-out infinite",
            }}
          />
        </div>
        <style>{`
          @keyframes loadBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(340%); }
          }
        `}</style>
      </div>
    </PublicShell>
  );
}
