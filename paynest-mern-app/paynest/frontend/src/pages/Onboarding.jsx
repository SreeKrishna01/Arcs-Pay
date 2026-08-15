import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Wallet2,
  ArrowLeftRight,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import PublicShell from "../components/PublicShell";

const SLIDE_MS = 3200;

const FEATURES = [
  {
    icon: Send,
    title: "Send Money in Seconds",
    desc: "Transfer instantly to any Arcs Pay user using just their mobile number or UPI ID.",
  },
  {
    icon: ArrowLeftRight,
    title: "Receive Instantly",
    desc: "Money lands in your wallet the moment it's sent. No waiting, no hidden fees.",
  },
  {
    icon: QrCode,
    title: "Scan & Pay",
    desc: "Pay at shops or get paid in a tap by sharing your QR code.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    desc: "Protected by UPI PIN and 24/7 fraud monitoring so your money stays safe.",
  },
  {
    icon: Wallet2,
    title: "All Your Money, One Wallet",
    desc: "Track your balance, spending and history in one beautiful dashboard.",
  },
];

function PhoneMock({ Icon }) {
  return (
    <div className="onboarding-phone">
      <div className="onboarding-phone-notch" />
      <div className="onboarding-phone-body">
        <div className="onboarding-phone-icon">
          <Icon size={34} color="#fff" strokeWidth={1.9} />
        </div>
        <div className="onboarding-phone-line w-70" />
        <div className="onboarding-phone-line w-45" />
        <div className="onboarding-phone-line w-55" />
        <div className="onboarding-phone-amount">+ ₹ 1,250</div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % FEATURES.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + FEATURES.length) % FEATURES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(next, SLIDE_MS);
    return () => clearInterval(id);
  }, [next]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <PublicShell>
      <div className="screen no-nav-padding onboarding">
        <div className="onboarding-brand">
          <span className="onboarding-logo">
            <img
              src="/logo.png"
              alt="Arcs Pay"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </span>
          <span style={{ fontWeight: 800, fontSize: 17 }}>Arcs Pay</span>
        </div>

        <div className="onboarding-slider">
          <div className="onboarding-progress">
            <div
              key={index}
              className="onboarding-progress-fill"
              style={{ animationDuration: `${SLIDE_MS}ms` }}
            />
          </div>

          <div
            className="onboarding-track"
            style={{ transform: `translateX(-${index * 100}%)` }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {FEATURES.map((f) => {
              const SlideIcon = f.icon;
              return (
                <div className="onboarding-slide" key={f.title}>
                  <PhoneMock Icon={SlideIcon} />
                  <h1 className="onboarding-title">{f.title}</h1>
                  <p className="text-secondary onboarding-desc">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="onboarding-dots">
          {FEATURES.map((f, i) => (
            <button
              key={f.title}
              className={`onboarding-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="btn btn-primary" onClick={() => navigate("/register")}>
            Create Free Account
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/login")}>
            I already have an account
          </button>
        </div>
      </div>
    </PublicShell>
  );
}
