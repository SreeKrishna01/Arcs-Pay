import { useEffect, useState } from "react";
import { Plus, Landmark, Trash2, CheckCircle2 } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomSheet from "../components/BottomSheet";
import Spinner from "../components/Spinner";
import { accountApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function BankAccounts() {
  const toast = useToast();
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountHolder: user?.name || "",
    accountNumber: "",
    ifsc: "",
    accountType: "Savings",
  });

  const load = () => {
    accountApi
      .list()
      .then(({ data }) => setAccounts(data.accounts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.bankName || !form.accountHolder || !form.accountNumber) {
      toast.error("Fill in all required fields");
      return;
    }
    try {
      const { data } = await accountApi.create(form);
      setAccounts((prev) => [...prev.map((a) => ({ ...a, isPrimary: data.account.isPrimary ? false : a.isPrimary })), data.account]);
      setShowAdd(false);
      setForm({ bankName: "", accountHolder: user?.name || "", accountNumber: "", ifsc: "", accountType: "Savings" });
      toast.success("Bank account added");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      const { data } = await accountApi.setPrimary(id);
      setAccounts((prev) => prev.map((a) => ({ ...a, isPrimary: a._id === id })));
      toast.success(`${data.account.bankName} set as primary`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemove = async (id) => {
    try {
      await accountApi.remove(id);
      setAccounts((prev) => prev.filter((a) => a._id !== id));
      toast.success("Account removed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="screen">
      <TopBar
        title="Bank Accounts"
        showBack={false}
        right={
          <button className="icon-btn" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
          </button>
        }
      />

      {loading ? (
        <Spinner />
      ) : accounts.length === 0 ? (
        <div className="card empty-state">
          <p style={{ fontWeight: 600 }}>No bank accounts linked</p>
          <p style={{ fontSize: 13 }}>Add a bank account to send and receive money.</p>
          <button className="btn btn-primary btn-sm mt-12" onClick={() => setShowAdd(true)}>
            Add Bank Account
          </button>
        </div>
      ) : (
        <div className="list-card">
          {accounts.map((acc) => (
            <div key={acc._id} className="list-item" style={{ cursor: "default" }}>
              <span className="list-item-icon">
                <Landmark size={16} />
              </span>
              <span className="list-item-body">
                {acc.bankName}
                <div className="list-item-sub">
                  •••• {acc.accountNumber} · {acc.accountType}
                </div>
              </span>
              {acc.isPrimary ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={14} /> Primary
                </span>
              ) : (
                <button
                  className="btn-ghost btn btn-sm"
                  onClick={() => handleSetPrimary(acc._id)}
                  style={{ padding: "6px 10px", fontSize: 11 }}
                >
                  Set Primary
                </button>
              )}
              <button onClick={() => handleRemove(acc._id)} style={{ background: "none", border: "none", padding: 4 }}>
                <Trash2 size={16} color="var(--text-muted)" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-muted mt-16" style={{ fontSize: 12, textAlign: "center" }}>
        Securely manage your bank accounts
      </p>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Bank Account">
        <form onSubmit={handleAdd}>
          <div className="field">
            <label>Bank Name</label>
            <input
              className="input"
              placeholder="e.g. Axis Bank"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Account Holder Name</label>
            <input
              className="input"
              value={form.accountHolder}
              onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Account Number</label>
            <input
              className="input"
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/[^0-9]/g, "") }))}
              inputMode="numeric"
            />
          </div>
          <div className="flex-row gap-12">
            <div className="field" style={{ flex: 1 }}>
              <label>IFSC Code</label>
              <input
                className="input"
                value={form.ifsc}
                onChange={(e) => setForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Type</label>
              <select
                className="select"
                value={form.accountType}
                onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value }))}
              >
                <option>Savings</option>
                <option>Current</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-8" type="submit">
            Add Account
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
