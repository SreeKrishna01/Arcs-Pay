import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, getErrorMessage } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Please enter your admin email/mobile and password");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await adminApi.login({ identifier, password });
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <img className="login-logo" src="/logo.png" alt="Arcs Pay" />
          Arcs Pay <span className="badge">Admin</span>
        </div>
        <p className="login-sub">Control panel for distributing and managing money.</p>

        {error && <div className="alert error">{error}</div>}

        <div className="field">
          <label>Admin Email / Mobile</label>
          <input
            className="input"
            placeholder="Enter"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="btn btn-primary" style={{ width: "100%", padding: "13px" }} disabled={submitting}>
          {submitting ? "Signing in..." : "Login to Admin Portal"}
        </button>
      </form>
    </div>
  );
}
