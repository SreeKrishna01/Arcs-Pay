import { useState } from "react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { userApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";

export default function ProfileDetails() {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile({ name, email });
      updateLocalUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen">
      <TopBar title="Personal Details" />

      <form onSubmit={handleSave}>
        <div className="field">
          <label>Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Mobile Number</label>
          <input className="input" value={`+91 ${user?.mobile || ""}`} disabled style={{ opacity: 0.6 }} />
        </div>
        <div className="field">
          <label>UPI ID</label>
          <input className="input" value={user?.upiId || ""} disabled style={{ opacity: 0.6 }} />
        </div>

        <button className="btn btn-primary mt-8" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
