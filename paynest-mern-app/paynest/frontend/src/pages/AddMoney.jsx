import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, CreditCard, Building2, Wallet, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import { accountApi, transactionApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function AddMoney() {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateLocalUser } = useAuth();

  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    accountApi
      .list()
      .then(({ data }) => {
        setAccounts(data.accounts);
        const primary = data.accounts.find((a) => a.isPrimary) || data.accounts[0];
        setSelectedAccount(primary || null);
      })
      .catch(() => {});
  }, []);

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setAmount(val);
  };

  const handleAddMoney = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await transactionApi.addMoney({
        amount: numAmount,
        accountId: selectedAccount?._id,
      });
      updateLocalUser({ balance: data.balance });
      navigate("/payment-success", {
        state: {
          type: "add_money",
          amount: numAmount,
          transaction: data.transaction,
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <TopBar title="Add Money" />

      <label className="text-secondary" style={{ fontSize: 13, fontWeight: 600 }}>
        Enter Amount
      </label>
      <div className="flex-row" style={{ margin: "8px 0 20px" }}>
        <span style={{ fontSize: 32, fontWeight: 800, marginRight: 6 }}>₹</span>
        <input
          className="input"
          style={{
            border: "none",
            background: "none",
            fontSize: 32,
            fontWeight: 800,
            padding: 0,
          }}
          placeholder="0"
          value={amount}
          onChange={handleAmountChange}
          inputMode="numeric"
          autoFocus
        />
      </div>

      <div className="chip-row mb-16">
        {QUICK_AMOUNTS.map((amt) => (
          <button key={amt} className="chip" type="button" onClick={() => setAmount(String(amt))}>
            + ₹{amt.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      <div className="section-title mt-12">From</div>
      {accounts.length === 0 ? (
        <div className="card mb-16">
          <p className="text-muted" style={{ fontSize: 13 }}>
            No bank accounts linked yet.
          </p>
          <button className="btn-ghost btn btn-sm mt-12" onClick={() => navigate("/bank-accounts")}>
            Add a bank account
          </button>
        </div>
      ) : (
        <div className="list-card mb-20">
          {accounts.map((acc) => (
            <button
              key={acc._id}
              className="list-item"
              onClick={() => setSelectedAccount(acc)}
              style={{
                background: selectedAccount?._id === acc._id ? "var(--bg-card-alt)" : "none",
              }}
            >
              <span className="list-item-icon">
                <Landmark size={16} />
              </span>
              <span className="list-item-body">
                {acc.bankName}
                <div className="list-item-sub">•••• {acc.accountNumber}</div>
              </span>
              {selectedAccount?._id === acc._id && (
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--gradient-brand)" }} />
              )}
            </button>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary mt-8"
        onClick={handleAddMoney}
        disabled={submitting || !amount || accounts.length === 0}
      >
        {submitting ? "Processing..." : "Add Money"}
      </button>

      <div className="section-title mt-24">Other Options</div>
      <div className="list-card">
        <button className="list-item" disabled>
          <span className="list-item-icon">
            <CreditCard size={16} />
          </span>
          <span className="list-item-body">Debit / Credit Card</span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
        <button className="list-item" disabled>
          <span className="list-item-icon">
            <Building2 size={16} />
          </span>
          <span className="list-item-body">Net Banking</span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
        <button className="list-item" disabled>
          <span className="list-item-icon">
            <Wallet size={16} />
          </span>
          <span className="list-item-body">Wallet</span>
          <ChevronRight size={16} className="row-chevron" />
        </button>
      </div>
    </div>
  );
}
