import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Palette, Globe, KeyRound, ShieldCheck, Info, Fingerprint, ChevronRight, Moon, Sun } from "lucide-react";
import TopBar from "../components/TopBar";
import Switch from "../components/Switch";
import BottomSheet from "../components/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { userApi, biometricApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";
import { enrollFingerprint, isFingerprintSupported } from "../utils/webauthn";

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada"];

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();

  const [showLang, setShowLang] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pinForm, setPinForm] = useState({ currentPin: "", pin: "" });

  const settings = user?.settings || {};

  const patchSettings = async (patch) => {
    try {
      const { data } = await userApi.updateSettings(patch);
      updateLocalUser({ settings: data.settings });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleFingerprint = async () => {
    if (busy) return;
    if (settings.fingerprintEnabled) {
      try {
        setBusy(true);
        const { data } = await biometricApi.remove();
        updateLocalUser({ settings: data.settings });
        toast.success("Fingerprint payments disabled");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!user?.hasUpiPin) {
      toast.error("Please set your UPI PIN before enabling fingerprint payments");
      return;
    }
    if (!isFingerprintSupported()) {
      toast.error("Fingerprint is not supported on this browser or device");
      return;
    }
    try {
      setBusy(true);
      const result = await enrollFingerprint();
      updateLocalUser({ settings: result.settings });
      toast.success("Fingerprint enabled! You can now pay with it.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
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
      <TopBar title="Settings" showBack={false} />

      <div className="list-card">
        <div className="list-item">
          <span className="list-item-icon">
            <Bell size={16} />
          </span>
          <span className="list-item-body">
            Notifications
            <div className="list-item-sub">Payment &amp; offer alerts</div>
          </span>
          <Switch
            on={settings.notificationsEnabled}
            onToggle={() => patchSettings({ notificationsEnabled: !settings.notificationsEnabled })}
          />
        </div>
        <button className="list-item" onClick={() => setShowTheme(true)}>
          <span className="list-item-icon">
            <Palette size={16} />
          </span>
          <span className="list-item-body">Theme</span>
          <span className="text-muted" style={{ fontSize: 12.5, marginRight: 4 }}>
            {settings.theme === "light" ? "Light" : "Dark"}
          </span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
        <button className="list-item" onClick={() => setShowLang(true)}>
          <span className="list-item-icon">
            <Globe size={16} />
          </span>
          <span className="list-item-body">Language</span>
          <span className="text-muted" style={{ fontSize: 12.5, marginRight: 4 }}>
            {settings.language || "English"}
          </span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
      </div>

      <div className="section-title mt-20">Account</div>
      <div className="list-card">
        <button className="list-item" onClick={() => setShowPin(true)}>
          <span className="list-item-icon">
            <KeyRound size={16} />
          </span>
          <span className="list-item-body">Change UPI PIN</span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
        <div className="list-item">
          <span className="list-item-icon">
            <Fingerprint size={16} />
          </span>
          <span className="list-item-body">
            Fingerprint Payments
            <div className="list-item-sub">Pay with your fingerprint instead of your PIN</div>
          </span>
          <Switch on={settings.fingerprintEnabled} onToggle={toggleFingerprint} />
        </div>
        {settings.fingerprintEnabled && (
          <div className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <span className="list-item-sub">Preferred payment method</span>
            <div className="segmented">
              <button
                type="button"
                className={`segmented-opt ${settings.paymentMethod === "pin" ? "active" : ""}`}
                onClick={() => patchSettings({ paymentMethod: "pin" })}
              >
                UPI PIN
              </button>
              <button
                type="button"
                className={`segmented-opt ${settings.paymentMethod === "fingerprint" ? "active" : ""}`}
                onClick={() => patchSettings({ paymentMethod: "fingerprint" })}
              >
                Fingerprint
              </button>
            </div>
          </div>
        )}
        <button className="list-item" onClick={() => navigate("/security")}>
          <span className="list-item-icon">
            <ShieldCheck size={16} />
          </span>
          <span className="list-item-body">Privacy &amp; Security</span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
      </div>

      <div className="section-title mt-20">About</div>
      <div className="list-card">
        <button className="list-item" onClick={() => navigate("/help")}>
          <span className="list-item-icon">
            <Info size={16} />
          </span>
          <span className="list-item-body">About Arcs Pay</span>
          <span className="text-muted" style={{ fontSize: 12.5, marginRight: 4 }}>
            Version 1.0.0
          </span>
        </button>
      </div>

      <BottomSheet open={showLang} onClose={() => setShowLang(false)} title="Choose Language">
        <div className="list-card">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              className="list-item"
              onClick={() => {
                patchSettings({ language: lang });
                setShowLang(false);
              }}
            >
              <span className="list-item-body">{lang}</span>
              {settings.language === lang && <ChevronRight size={16} className="row-chevron" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showTheme} onClose={() => setShowTheme(false)} title="Choose Theme">
        <div className="list-card">
          <button
            className="list-item"
            onClick={() => {
              patchSettings({ theme: "dark" });
              setShowTheme(false);
            }}
          >
            <span className="list-item-icon">
              <Moon size={16} />
            </span>
            <span className="list-item-body">Dark</span>
            {(settings.theme || "dark") === "dark" && <ChevronRight size={16} className="row-chevron" />}
          </button>
          <button
            className="list-item"
            onClick={() => {
              patchSettings({ theme: "light" });
              setShowTheme(false);
            }}
          >
            <span className="list-item-icon">
              <Sun size={16} />
            </span>
            <span className="list-item-body">Light (Day)</span>
            {settings.theme === "light" && <ChevronRight size={16} className="row-chevron" />}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={showPin} onClose={() => setShowPin(false)} title="Change UPI PIN">
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
