import { useState } from "react";
import { ShieldCheck, Fingerprint, Lock, KeyRound, Smartphone, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import Switch from "../components/Switch";
import BottomSheet from "../components/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { userApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";

export default function Security() {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();

  const settings = user?.settings || {};

  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [showPin, setShowPin] = useState(false);
  const [pinForm, setPinForm] = useState({ currentPin: "", pin: "" });

  const patchSettings = async (patch) => {
    try {
      const { data } = await userApi.updateSettings(patch);
      updateLocalUser({ settings: data.settings });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await userApi.changePassword(pwForm);
      toast.success("Password updated successfully");
      setShowPassword(false);
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePinSave = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pinForm.pin)) {
      toast.error("PIN must be 4-6 digits");
      return;
    }
    try {
      await userApi.setUpiPin(pinForm);
      updateLocalUser({ hasUpiPin: true });
      toast.success("UPI PIN updated");
      setShowPin(false);
      setPinForm({ currentPin: "", pin: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="screen">
      <TopBar title="Security" />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "var(--gradient-brand-soft)",
            border: "1px solid var(--border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={34} color="var(--accent-magenta)" />
        </div>
      </div>

      <div className="list-card">
        <div className="list-item">
          <span className="list-item-icon">
            <Fingerprint size={16} />
          </span>
          <span className="list-item-body">
            Biometric Login
            <div className="list-item-sub">Use fingerprint to login</div>
          </span>
          <Switch
            on={settings.biometricLogin}
            onToggle={() => patchSettings({ biometricLogin: !settings.biometricLogin })}
          />
        </div>

        <button className="list-item" onClick={() => setShowPassword(true)}>
          <span className="list-item-icon">
            <Lock size={16} />
          </span>
          <span className="list-item-body">
            Change Login Password
            <div className="list-item-sub">Update your password</div>
          </span>
          <ChevronRight size={16} className="row-chevron" />
        </button>

        <button className="list-item" onClick={() => setShowPin(true)}>
          <span className="list-item-icon">
            <KeyRound size={16} />
          </span>
          <span className="list-item-body">
            UPI PIN
            <div className="list-item-sub">Reset your UPI PIN</div>
          </span>
          <ChevronRight size={16} className="row-chevron" />
        </button>

        <div className="list-item">
          <span className="list-item-icon">
            <Smartphone size={16} />
          </span>
          <span className="list-item-body">
            Two-step Verification
            <div className="list-item-sub">Extra layer of security</div>
          </span>
          <Switch
            on={settings.twoStepVerification}
            onToggle={() => patchSettings({ twoStepVerification: !settings.twoStepVerification })}
          />
        </div>
      </div>

      <BottomSheet open={showPassword} onClose={() => setShowPassword(false)} title="Change Password">
        <form onSubmit={handlePasswordChange}>
          <div className="field">
            <label>Current Password</label>
            <input
              className="input"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>New Password</label>
            <input
              className="input"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary mt-8" type="submit">
            Update Password
          </button>
        </form>
      </BottomSheet>

      <BottomSheet open={showPin} onClose={() => setShowPin(false)} title="Reset UPI PIN">
        <form onSubmit={handlePinSave}>
          {user?.hasUpiPin && (
            <div className="field">
              <label>Current PIN</label>
              <input
                className="input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm.currentPin}
                onChange={(e) => setPinForm((f) => ({ ...f, currentPin: e.target.value.replace(/[^0-9]/g, "") }))}
              />
            </div>
          )}
          <div className="field">
            <label>New PIN (4-6 digits)</label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinForm.pin}
              onChange={(e) => setPinForm((f) => ({ ...f, pin: e.target.value.replace(/[^0-9]/g, "") }))}
            />
          </div>
          <button className="btn btn-primary mt-8" type="submit">
            Save PIN
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
