import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import PublicShell from "../components/PublicShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.mobile || !form.password) {
      setError("Please fill in your name, mobile number and password");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms & Conditions to continue");
      return;
    }

    setSubmitting(true);
    const result = await register(form);
    setSubmitting(false);

    if (result.success) {
      toast.success("Account created! Welcome to Arcs Pay.");
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

        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Create Account</h1>
        <p className="text-secondary mb-16" style={{ fontSize: 14 }}>
          Let's get you started
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input className="input" placeholder="Enter your name" value={form.name} onChange={update("name")} />
          </div>

          <div className="field">
            <label>Mobile Number</label>
            <div className="input-wrap">
              <span
                style={{
                  position: "absolute",
                  left: 16,
                  color: "var(--text-secondary)",
                  fontSize: 15,
                }}
              >
                +91
              </span>
              <input
                className="input"
                style={{ paddingLeft: 46 }}
                placeholder="Enter mobile number"
                value={form.mobile}
                onChange={update("mobile")}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="field">
            <label>Email (optional)</label>
            <input
              className="input"
              placeholder="Enter email address"
              value={form.email}
              onChange={update("email")}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={form.password}
                onChange={update("password")}
              />
              <button
                type="button"
                className="input-suffix-btn"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the <span className="link-accent">Terms &amp; Conditions</span>
            </span>
          </label>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-secondary mt-24" style={{ textAlign: "center", fontSize: 13.5 }}>
          Already have an account?{" "}
          <span className="link-accent" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </PublicShell>
  );
}
