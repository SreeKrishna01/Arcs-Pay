import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Plus, Trash2 } from "lucide-react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import BottomSheet from "../components/BottomSheet";
import Spinner from "../components/Spinner";
import { recipientApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";

export default function Recipients() {
  const navigate = useNavigate();
  const toast = useToast();

  const [recipients, setRecipients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", upiId: "", phone: "" });

  const load = () => {
    recipientApi
      .list()
      .then(({ data }) => setRecipients(data.recipients))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return recipients;
    const q = search.toLowerCase();
    return recipients.filter((r) => r.name.toLowerCase().includes(q) || r.upiId.toLowerCase().includes(q));
  }, [recipients, search]);

  const favorites = filtered.filter((r) => r.favorite);
  const others = filtered.filter((r) => !r.favorite);

  const toggleFavorite = async (id) => {
    try {
      const { data } = await recipientApi.toggleFavorite(id);
      setRecipients((prev) => prev.map((r) => (r._id === id ? data.recipient : r)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.upiId) {
      toast.error("Name and UPI ID are required");
      return;
    }
    try {
      const { data } = await recipientApi.create(form);
      setRecipients((prev) => [data.recipient, ...prev]);
      setShowAdd(false);
      setForm({ name: "", upiId: "", phone: "" });
      toast.success("Recipient added");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemove = async (id) => {
    try {
      await recipientApi.remove(id);
      setRecipients((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const goToPay = (r) => navigate("/send-money", { state: { prefillUpi: r.upiId } });

  return (
    <div className="screen">
      <TopBar
        title="Recipients"
        showBack={false}
        right={
          <button className="icon-btn" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
          </button>
        }
      />

      <div className="input-wrap mb-20">
        <input
          className="input"
          placeholder="Search recipients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="input-suffix-btn" style={{ pointerEvents: "none" }}>
          <Search size={17} />
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {favorites.length > 0 && (
            <>
              <div className="section-title">Frequently Used</div>
              <div className="chip-row mb-20" style={{ gap: 18 }}>
                {favorites.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => goToPay(r)}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Avatar name={r.name} color={r.avatarColor} size={52} />
                    <span style={{ fontSize: 11.5, fontWeight: 600 }}>{r.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="section-title">All Contacts</div>
          <div className="list-card">
            {filtered.length === 0 ? (
              <p className="text-muted" style={{ padding: 16, fontSize: 13 }}>
                No recipients found.
              </p>
            ) : (
              [...favorites, ...others].map((r) => (
                <div key={r._id} className="list-item" style={{ cursor: "default" }}>
                  <div onClick={() => goToPay(r)} className="flex-row gap-12" style={{ flex: 1, cursor: "pointer" }}>
                    <Avatar name={r.name} color={r.avatarColor} size={36} />
                    <span className="list-item-body">
                      {r.name}
                      <div className="list-item-sub">{r.upiId}</div>
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(r._id)}
                    style={{ background: "none", border: "none", padding: 4 }}
                  >
                    <Star
                      size={18}
                      color={r.favorite ? "var(--warning)" : "var(--text-muted)"}
                      fill={r.favorite ? "var(--warning)" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => handleRemove(r._id)}
                    style={{ background: "none", border: "none", padding: 4 }}
                  >
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Recipient">
        <form onSubmit={handleAdd}>
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>UPI ID</label>
            <input
              className="input"
              placeholder="name@upi"
              value={form.upiId}
              onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Phone (optional)</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary mt-8" type="submit">
            Add Recipient
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
