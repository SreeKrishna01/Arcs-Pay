import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) {
      setError("Please enter your admin email/mobile and password.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await adminApi.login({
        identifier: cleanIdentifier,
        password: password,
      });

      const data = response.data;

      if (!data?.token) {
        setError("Login failed: no authentication token received.");
        return;
      }

      // Save admin authentication
      localStorage.setItem("admin_token", data.token);

      if (data.user) {
        localStorage.setItem(
          "admin_user",
          JSON.stringify(data.user)
        );
      }

      // Go to admin dashboard
      navigate("/", { replace: true });

    } catch (err) {
      console.error("Admin login error:", err);

      if (err.response?.status === 401) {
        setError(
          err.response?.data?.message ||
          "Invalid admin email/mobile or password."
        );
      } else if (err.response?.status === 403) {
        setError(
          err.response?.data?.message ||
          "You do not have permission to access the admin panel."
        );
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError(
          "Unable to connect to the server. Please try again."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      <form
        className="login-card"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="login-brand">
          <img
            className="login-logo"
            src="/logo.png"
            alt="Arcs Pay"
          />

          Arcs Pay <span className="badge">Admin</span>
        </div>

        <p className="login-sub">
          Control panel for distributing and managing money.
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="identifier">
            Admin Email / Mobile
          </label>

          <input
            id="identifier"
            className="input"
            type="text"
            placeholder="Enter admin email or mobile"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            disabled={submitting}
          />
        </div>

        <div className="field">
          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            className="input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "13px",
          }}
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Login to Admin Portal"}
        </button>
      </form>
    </div>
  );
}
