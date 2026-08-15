import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, getErrorMessage } from "../api";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
      ", " +
      new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : "—";
const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

const STAT_CARDS = [
  { key: "totalUsers", label: "Total Users", sub: "Registered accounts" },
  { key: "activeUsers", label: "Active Users", sub: "Currently allowed" },
  { key: "blockedUsers", label: "Blocked Users", sub: "Suspended accounts" },
  { key: "moneyInCirculation", label: "Money in Circulation", sub: "Sum of all user balances", money: true },
  { key: "totalTransactions", label: "Total Transactions", sub: "Across all users" },
  { key: "totalDisbursed", label: "Total Disbursed", sub: "Sent to users by admin", money: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState(null); // {type: send|deduct|create|view, user}
  const [viewData, setViewData] = useState(null);
  const [confirm, setConfirm] = useState(null); // {type: delete|block, user}
  const [busy, setBusy] = useState(false);

  const [moneyForm, setMoneyForm] = useState({ amount: "", note: "" });
  const [createForm, setCreateForm] = useState({ name: "", mobile: "", email: "", password: "", balance: "", note: "" });

  const loadStats = async () => {
    try {
      const { data } = await adminApi.stats();
      setStats(data.stats);
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
    }
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (sort) params.sort = sort;
      const { data } = await adminApi.users(params);
      setUsers(data.users);
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
    }
  };

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem("admin_user");
        if (stored) setAdmin(JSON.parse(stored));
        const meRes = await adminApi.me();
        setAdmin(meRes.data.user);
        localStorage.setItem("admin_user", JSON.stringify(meRes.data.user));
        await Promise.all([loadStats(), loadUsers()]);
      } catch (err) {
        setAlert({ type: "error", message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort]);

  const notify = (msg, type = "success") => {
    setAlert({ type, message: msg });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = async () => {
    await Promise.all([loadStats(), loadUsers()]);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/login", { replace: true });
  };

  const openSend = (user) => {
    setMoneyForm({ amount: "", note: "" });
    setModal({ type: "send", user });
  };

  const openDeduct = (user) => {
    setMoneyForm({ amount: "", note: "" });
    setModal({ type: "deduct", user });
  };

  const submitMoney = async (e) => {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    try {
      const payload = { amount: Number(moneyForm.amount), note: moneyForm.note };
      const { data } =
        modal.type === "send"
          ? await adminApi.sendMoney(modal.user.id, payload)
          : await adminApi.deductMoney(modal.user.id, payload);
      notify(data.message);
      setModal(null);
      await refresh();
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await adminApi.createUser({
        name: createForm.name,
        mobile: createForm.mobile,
        email: createForm.email,
        password: createForm.password,
        balance: createForm.balance,
        note: createForm.note,
      });
      notify(data.message);
      setModal(null);
      setCreateForm({ name: "", mobile: "", email: "", password: "", balance: "", note: "" });
      await refresh();
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const openView = async (user) => {
    setModal({ type: "view", user });
    setViewData(null);
    try {
      const { data } = await adminApi.user(user.id);
      setViewData(data);
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
      setModal(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      let data;
      if (confirm.type === "block") data = (await adminApi.toggleBlock(confirm.user.id)).data;
      else if (confirm.type === "delete") data = (await adminApi.deleteUser(confirm.user.id)).data;
      notify(data.message);
      setConfirm(null);
      await refresh();
    } catch (err) {
      setAlert({ type: "error", message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const confirmBody = useMemo(() => {
    if (!confirm) return null;
    if (confirm.type === "block")
      return confirm.user.isActive
        ? `${confirm.user.name} will be blocked and will not be able to log in.`
        : `${confirm.user.name} will be unblocked and allowed to log in again.`;
    if (confirm.type === "delete")
      return `${confirm.user.name} will be permanently deleted along with all transactions, cards, accounts and notifications. Their balance (${inr(
        confirm.user.balance
      )}) will be returned to the admin wallet.`;
    return null;
  }, [confirm]);

  if (loading) {
    return (
      <div className="admin-app">
        <div className="wrap" style={{ textAlign: "center", paddingTop: 80, color: "var(--ink-3)" }}>
          Loading admin portal...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/logo.png" alt="Arcs Pay" />
          Arcs Pay <span className="badge">Admin</span>
        </div>
        <div className="spacer" />
        <div className="admin-balance-pill">
          <span>
            <span className="lbl">Admin Balance</span> {inr(admin?.balance ?? 0)}
          </span>
        </div>
        <button className="btn btn-ghost-dark" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="wrap">
        {alert && (
          <div className={`alert ${alert.type}`}>
            {alert.message}
            <button className="close" onClick={() => setAlert(null)}>
              ×
            </button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-lbl">Admin Wallet</div>
            <div className="stat-val">{inr(admin?.balance ?? 0)}</div>
            <div className="stat-sub">Fund pool</div>
          </div>
          {STAT_CARDS.map((c) => (
            <div className="stat-card" key={c.key}>
              <div className="stat-lbl">{c.label}</div>
              <div className="stat-val">{c.money ? inr(stats?.[c.key]) : (stats?.[c.key] ?? 0)}</div>
              <div className="stat-sub">{c.sub}</div>
            </div>
          ))}
        </section>

        <section className="panel" style={{ marginBottom: 22, background: "#f6f3ff", borderColor: "#dcd3fb" }}>
          <div className="panel-head">
            <h2 style={{ fontSize: 15, marginRight: "auto" }}>User Management</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: "create" })}>
              + Create User
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>
              Users <span style={{ color: "var(--ink-3)", fontSize: 13 }}>({users.length} shown)</span>
            </h2>
            <div className="toolbar">
              <input
                className="input"
                placeholder="Search name, mobile, email, UPI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="balance_high">Balance: high → low</option>
                <option value="balance_low">Balance: low → high</option>
                <option value="name">Name A → Z</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="users">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>UPI ID</th>
                  <th>Balance</th>
                  <th>Txns</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="table-empty">
                      No users found.
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar" style={{ background: u.avatarColor }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="u-name">{u.name}</div>
                          <div className="u-upi">has PIN: {u.hasUpiPin ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{u.mobile}</td>
                    <td>{u.email || "—"}</td>
                    <td className="mono">{u.upiId}</td>
                    <td className={`amount-${u.balance === 0 ? "zero" : "pos"} mono`}>{inr(u.balance)}</td>
                    <td>{u.transactionCount}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>
                      <span className={`badge ${u.isActive ? "active" : "blocked"}`}>
                        <span className="dot" />
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-xs" onClick={() => openView(u)}>
                          View
                        </button>
                        <button className="btn btn-success btn-xs" onClick={() => openSend(u)}>
                          Send ₹
                        </button>
                        <button className="btn btn-warn btn-xs" onClick={() => openDeduct(u)}>
                          Deduct
                        </button>
                        <button
                          className={`btn btn-xs ${u.isActive ? "btn-danger" : "btn-ghost"}`}
                          onClick={() => setConfirm({ type: "block", user: u })}
                        >
                          {u.isActive ? "Block" : "Unblock"}
                        </button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setConfirm({ type: "delete", user: u })}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Send / Deduct modal */}
      {modal?.type === "send" && (
        <Modal title={`Send money to ${modal.user.name}`} onClose={() => setModal(null)}>
          <form onSubmit={submitMoney}>
            <div className="kv-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="kv">
                <div className="k">User balance</div>
                <div className="v">{inr(modal.user.balance)}</div>
              </div>
              <div className="kv">
                <div className="k">Admin balance</div>
                <div className="v">{inr(admin?.balance ?? 0)}</div>
              </div>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <input
                className="input"
                type="number"
                min="1"
                max={admin?.balance ?? 0}
                placeholder="e.g. 5000"
                value={moneyForm.amount}
                onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })}
                required
              />
              <div className="hint">
                Available to send: {inr(admin?.balance ?? 0)} (top up first if you need more than ₹1,00,000)
              </div>
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input
                className="input"
                placeholder="e.g. Salary advance, UPI test run..."
                value={moneyForm.note}
                onChange={(e) => setMoneyForm({ ...moneyForm, note: e.target.value })}
              />
            </div>
            <ModalFooter onCancel={() => setModal(null)} busy={busy} label={`Send ${inr(moneyForm.amount)}`} type="success" />
          </form>
        </Modal>
      )}

      {/* Deduct modal */}
      {modal?.type === "deduct" && (
        <Modal title={`Deduct from ${modal.user.name}`} onClose={() => setModal(null)}>
          <form onSubmit={submitMoney}>
            <div className="kv-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="kv">
                <div className="k">User balance</div>
                <div className="v">{inr(modal.user.balance)}</div>
              </div>
              <div className="kv">
                <div className="k">Admin balance</div>
                <div className="v">{inr(admin?.balance ?? 0)}</div>
              </div>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <input
                className="input"
                type="number"
                min="1"
                max={modal.user.balance}
                placeholder="e.g. 1000"
                value={moneyForm.amount}
                onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })}
                required
              />
              <div className="hint">Money goes back into the admin wallet.</div>
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input
                className="input"
                placeholder="e.g. Reclaim unused money"
                value={moneyForm.note}
                onChange={(e) => setMoneyForm({ ...moneyForm, note: e.target.value })}
              />
            </div>
            <ModalFooter onCancel={() => setModal(null)} busy={busy} label={`Deduct ${inr(moneyForm.amount)}`} type="danger" />
          </form>
        </Modal>
      )}

      {/* Create user modal */}
      {modal?.type === "create" && (
        <Modal title="Create User" onClose={() => setModal(null)}>
          <form onSubmit={submitCreate}>
            <div className="field">
              <label>Full name</label>
              <input
                className="input"
                placeholder="e.g. Karthik R"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div className="row-2">
              <div className="field">
                <label>Mobile number</label>
                <input
                  className="input"
                  placeholder="10 digit number"
                  value={createForm.mobile}
                  onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value.replace(/\D/g, "") })}
                  required
                />
              </div>
              <div className="field">
                <label>Email (optional)</label>
                <input
                  className="input"
                  placeholder="name@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="row-2">
              <div className="field">
                <label>Password</label>
                <input
                  className="input"
                  type="text"
                  placeholder="min 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Opening balance (₹)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={createForm.balance}
                  onChange={(e) => setCreateForm({ ...createForm, balance: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input
                className="input"
                placeholder="e.g. UPI trial user"
                value={createForm.note}
                onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
              />
            </div>
            <div className="hint" style={{ margin: "0 0 14px", fontSize: 12, color: "var(--ink-3)" }}>
              Opening balance is debited from the admin wallet. UPI ID is auto-generated as name+last4@arcspay.
            </div>
            <ModalFooter onCancel={() => setModal(null)} busy={busy} label="Create User" type="primary" />
          </form>
        </Modal>
      )}

      {/* View user modal */}
      {modal?.type === "view" && (
        <Modal title={`User: ${modal.user.name}`} onClose={() => setModal(null)} lg>
          {!viewData ? (
            <div className="table-empty">Loading user details...</div>
          ) : (
            <>
              <div className="kv-grid">
                <div className="kv">
                  <div className="k">Mobile</div>
                  <div className="v mono">{viewData.user.mobile}</div>
                </div>
                <div className="kv">
                  <div className="k">Email</div>
                  <div className="v">{viewData.user.email || "—"}</div>
                </div>
                <div className="kv">
                  <div className="k">UPI ID</div>
                  <div className="v mono">{viewData.user.upiId}</div>
                </div>
                <div className="kv">
                  <div className="k">Balance</div>
                  <div className="v">{inr(viewData.user.balance)}</div>
                </div>
                <div className="kv">
                  <div className="k">Status</div>
                  <div className="v">{viewData.user.isActive ? "Active" : "Blocked"}</div>
                </div>
                <div className="kv">
                  <div className="k">UPI PIN</div>
                  <div className="v">{viewData.user.hasUpiPin ? "Set" : "Not set"}</div>
                </div>
                <div className="kv">
                  <div className="k">Joined</div>
                  <div className="v">{fmtDate(viewData.user.createdAt)}</div>
                </div>
                <div className="kv">
                  <div className="k">Bank accounts</div>
                  <div className="v">{viewData.accounts.length}</div>
                </div>
                <div className="kv">
                  <div className="k">Cards</div>
                  <div className="v">{viewData.cards.length}</div>
                </div>
                <div className="kv">
                  <div className="k">Recipients</div>
                  <div className="v">{viewData.recipients.length}</div>
                </div>
              </div>

              <div className="row-actions" style={{ marginBottom: 8 }}>
                <button className="btn btn-success btn-sm" onClick={() => { const u = modal.user; setModal(null); openSend(u); }}>
                  Send money
                </button>
                <button className="btn btn-warn btn-sm" onClick={() => { const u = modal.user; setModal(null); openDeduct(u); }}>
                  Deduct money
                </button>
              </div>

              <div className="mini-title">Bank Accounts</div>
              {viewData.accounts.length === 0 ? (
                <p className="table-empty" style={{ padding: 16 }}>No bank accounts linked.</p>
              ) : (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Bank</th>
                      <th>Holder</th>
                      <th>Account</th>
                      <th>IFSC</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.accounts.map((a) => (
                      <tr key={a._id}>
                        <td>{a.bankName}</td>
                        <td>{a.accountHolder}</td>
                        <td className="mono">•••• {a.accountNumber}</td>
                        <td className="mono">{a.ifsc}</td>
                        <td>{a.accountType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mini-title">Recent Transactions ({viewData.transactions.length})</div>
              {viewData.transactions.length === 0 ? (
                <p className="table-empty" style={{ padding: 16 }}>No transactions yet.</p>
              ) : (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Counterparty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.transactions.map((t) => (
                      <tr key={t._id}>
                        <td>{fmtDateTime(t.createdAt)}</td>
                        <td>{t.category}</td>
                        <td>{t.counterpartyName}</td>
                        <td className={t.direction === "credit" ? "amount-pos mono" : "amount-neg mono"}>
                          {t.direction === "credit" ? "+ " : "− "}
                          {inr(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Modal>
      )}

      {/* Confirm modal */}
      {confirm && (
        <Modal
          title={
            confirm.type === "block"
              ? confirm.user.isActive
                ? "Block user?"
                : "Unblock user?"
              : "Delete user?"
          }
          onClose={() => setConfirm(null)}
        >
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>{confirmBody}</p>
          <ModalFooter
            onCancel={() => setConfirm(null)}
            busy={busy}
            label={
              confirm.type === "block"
                ? confirm.user.isActive
                  ? "Block user"
                  : "Unblock user"
                : "Delete permanently"
            }
            type={confirm.type === "block" && !confirm.user.isActive ? "primary" : "danger"}
            run={runConfirm}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, lg }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${lg ? "lg" : ""}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, busy, label, type, run }) {
  return (
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button className={`btn btn-${type}`} type={run ? "button" : "submit"} disabled={busy} onClick={run}>
        {busy ? "Working..." : label}
      </button>
    </div>
  );
}
