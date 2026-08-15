import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import PublicShell from "../components/PublicShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Please enter your email/mobile and password");
      return;
    }
    setSubmitting(true);
    const result = await login({ identifier, password });
    setSubmitting(false);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <PublicShell>
      <div className="screen no-nav-padding">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate("/onboarding")}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Welcome Back!</h1>
        <p className="text-secondary mb-16" style={{ fontSize: 14 }}>
          Login to continue
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email / Mobile Number</label>
            <input
              className="input"
              placeholder="Enter email or mobile"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-suffix-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <p style={{ textAlign: "right", marginBottom: 22 }}>
            <span className="link-accent" style={{ fontSize: 13 }}>
              Forgot password?
            </span>
          </p>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex-row mt-24" style={{ gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          <span className="text-muted" style={{ fontSize: 12 }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>

        <div className="flex-row mt-16" style={{ gap: 12, justifyContent: "center" }}>
          {["G", "\uf8ff", "in"].map((label, i) => (
            <button
              key={i}
              type="button"
              className="icon-btn"
              style={{ width: 52, height: 52 }}
              disabled
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>{label}</span>
            </button>
          ))}
        </div>

        <p className="text-secondary mt-24" style={{ textAlign: "center", fontSize: 13.5 }}>
          Don't have an account?{" "}
          <span className="link-accent" onClick={() => navigate("/register")}>
            Sign up
          </span>
        </p>
      </div>
    </PublicShell>
  );
}
