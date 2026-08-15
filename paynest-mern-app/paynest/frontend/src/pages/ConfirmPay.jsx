import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Fingerprint } from "lucide-react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import PinPad from "../components/PinPad";
import { accountApi, transactionApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format";
import { verifyFingerprint } from "../utils/webauthn";

export default function ConfirmPay() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, updateLocalUser } = useAuth();

  const { recipient, amount, note } = location.state || {};

  const fingerprintEnabled = !!user?.settings?.fingerprintEnabled;

  const [account, setAccount] = useState(null);
  const [pin, setPin] = useState("");
  const [method, setMethod] = useState(fingerprintEnabled && user?.settings?.paymentMethod === "fingerprint" ? "fingerprint" : "pin");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!recipient || !amount) {
      navigate("/send-money", { replace: true });
      return;
    }
    accountApi
      .list()
      .then(({ data }) => {
        const primary = data.accounts.find((a) => a.isPrimary) || data.accounts[0];
        setAccount(primary || null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (method === "pin" && pin.length === 6) {
      handlePay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, method]);

  if (!recipient || !amount) return null;

  const fromLabel = account ? `${account.bankName} •••• ${account.accountNumber}` : "Arcs Pay Wallet";

  const handlePay = async (token) => {
    setSubmitting(true);
    try {
      const { data } = await transactionApi.send({
        name: recipient.name,
        upiId: recipient.upiId,
        amount,
        note,
        pin: method === "pin" ? pin : undefined,
        fingerprintToken: token,
        fromLabel,
      });
      updateLocalUser({ balance: data.balance });
      navigate("/payment-success", {
        state: { type: "sent", amount, transaction: data.transaction },
        replace: true,
      });
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPin("");
      setSubmitting(false);
      return false;
    }
  };

  const handleFingerprintPay = async () => {
    if (verifying || submitting) return;
    setVerifying(true);
    try {
      const result = await verifyFingerprint();
      const ok = await handlePay(result.fingerprintToken);
      if (!ok) setVerifying(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setVerifying(false);
    }
  };

  return (
    <div className="screen no-nav-padding">
      <TopBar title="Confirm & Pay" />

      <div className="card" style={{ textAlign: "center", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Avatar name={recipient.name} color={recipient.avatarColor} size={56} fontSize={20} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{recipient.name}</div>
        <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
          {recipient.upiId}
        </div>
      </div>

      <div className="mt-20" style={{ textAlign: "center" }}>
        <label className="text-secondary" style={{ fontSize: 13, fontWeight: 600 }}>
          Amount
        </label>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6 }}>{formatCurrency(amount)}</div>
      </div>

      {note && (
        <div className="card mt-20">
          <div className="text-secondary" style={{ fontSize: 12, fontWeight: 600 }}>
            Note
          </div>
          <div style={{ marginTop: 4, fontSize: 14 }}>{note}</div>
        </div>
      )}

      <div className="card mt-16">
        <div className="text-secondary" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          From
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{fromLabel}</div>
      </div>

      {fingerprintEnabled && (
        <div className="mt-24">
          <label className="text-secondary" style={{ fontSize: 13, fontWeight: 600 }}>
            Pay with
          </label>
          <div className="segmented mt-8">
            <button
              type="button"
              className={`segmented-opt ${method === "pin" ? "active" : ""}`}
              onClick={() => {
                setMethod("pin");
                setPin("");
              }}
            >
              UPI PIN
            </button>
            <button
              type="button"
              className={`segmented-opt ${method === "fingerprint" ? "active" : ""}`}
              onClick={() => setMethod("fingerprint")}
            >
              Fingerprint
            </button>
          </div>
        </div>
      )}

      <div className="mt-24" style={{ flex: 1 }}>
        {method === "pin" ? (
          <>
            <label className="text-secondary" style={{ fontSize: 13, fontWeight: 600 }}>
              Enter UPI PIN
            </label>
            <PinPad value={pin} onChange={setPin} />
          </>
        ) : (
          <button
            className="fingerprint-pay"
            onClick={handleFingerprintPay}
            disabled={verifying || submitting}
          >
            <span className="fingerprint-icon">
              <Fingerprint size={34} />
            </span>
            <span className="text-secondary" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {verifying ? "Checking fingerprint..." : "Tap to verify with fingerprint"}
            </span>
          </button>
        )}
      </div>

      <button
        className="btn btn-primary mt-20"
        disabled={submitting || (method === "pin" && pin.length < 4)}
        onClick={() => (method === "pin" ? handlePay() : handleFingerprintPay())}
      >
        {submitting ? "Processing..." : `Pay ${formatCurrency(amount)}`}
      </button>

      <p className="text-muted mt-16" style={{ textAlign: "center", fontSize: 11.5 }}>
        Powered by <strong style={{ color: "var(--text-secondary)" }}>UPI</strong>
      </p>
    </div>
  );
}
