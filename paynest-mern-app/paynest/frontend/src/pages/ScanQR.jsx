import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Image as ImageIcon, X, Share2, Copy, Check, CameraOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { decodeCanvas, decodeImageSource, upiFromQrText } from "../utils/qrDecoder";

const CAMERA_SCALE = 480;

export default function ScanQR() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [mode, setMode] = useState("scan"); // "scan" | "mycode"
  const [manualUpi, setManualUpi] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [camState, setCamState] = useState("idle"); // idle | starting | on | denied | error
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [found, setFound] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const genRef = useRef(0);
  const fileRef = useRef(null);

  const stopCamera = useCallback(() => {
    genRef.current += 1;
    if (loopRef.current) {
      clearTimeout(loopRef.current);
      loopRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleDecodedText = useCallback(
    (text) => {
      const parsed = upiFromQrText(text);
      if (!parsed) {
        toast.error("This QR code doesn't contain a UPI ID");
        return false;
      }
      setFound(parsed);
      stopCamera();
      setTimeout(() => {
        navigate("/send-money", { state: { prefillUpi: parsed.upiId } });
      }, 700);
      return true;
    },
    [navigate, stopCamera, toast]
  );

  const runScanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      loopRef.current = setTimeout(runScanLoop, 150);
      return;
    }
    const scale = Math.min(1, CAMERA_SCALE / (video.videoWidth || 1));
    const w = Math.round(video.videoWidth * scale) || 320;
    const h = Math.round(video.videoHeight * scale) || 240;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, w, h);
    decodeCanvas(canvas)
      .then((text) => {
        if (text) handleDecodedText(text);
      })
      .catch(() => {})
      .finally(() => {
        if (streamRef.current && !found) {
          loopRef.current = setTimeout(runScanLoop, 250);
        }
      });
  }, [found, handleDecodedText]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    const gen = ++genRef.current;
    setCamState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (gen !== genRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() || {};
      setTorchSupported(!!capabilities.torch);
      setCamState("on");
      runScanLoop();
    } catch (err) {
      if (gen === genRef.current) {
        const name = err?.name || "";
        setCamState(name === "NotAllowedError" || name === "PermissionDeniedError" ? "denied" : "error");
      }
    }
  }, [runScanLoop]);

  useEffect(() => {
    if (mode !== "scan") return;
    startCamera();
    return stopCamera;
  }, [mode, startCamera, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (err) {
      toast.error("Flash is not available on this device");
    }
  };

  const handleGalleryFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();
      const text = await decodeImageSource(img);
      URL.revokeObjectURL(img.src);
      if (text) handleDecodedText(text);
      else toast.error("No QR code found in the image");
    } catch (err) {
      toast.error("Couldn't read that image");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualUpi.includes("@")) {
      toast.error("Enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    navigate("/send-money", { state: { prefillUpi: manualUpi } });
  };

  const upiPayString = `upi://pay?pa=${encodeURIComponent(user?.upiId || "")}&pn=${encodeURIComponent(
    user?.name || ""
  )}&cu=INR`;

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(user?.upiId || "");
      toast.success("UPI ID copied to clipboard");
    } catch (err) {
      toast.info(user?.upiId || "");
    }
  };

  return (
    <div className="screen no-nav-padding" style={{ padding: 0, position: "relative", minHeight: "100vh" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 40%, rgba(124,58,237,0.25), transparent 60%), linear-gradient(180deg, #0a0619, #050310)",
        }}
      />

      <div style={{ position: "relative", padding: "22px 20px 0" }}>
        <div className="top-bar" style={{ marginBottom: 18 }}>
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <X size={20} />
          </button>
          <h1>{mode === "scan" ? "Scan & Pay" : "My QR Code"}</h1>
        </div>

        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${mode === "scan" ? "active" : ""}`} onClick={() => setMode("scan")}>
            Scan
          </button>
          <button className={`tab ${mode === "mycode" ? "active" : ""}`} onClick={() => setMode("mycode")}>
            My QR Code
          </button>
        </div>
      </div>

      {mode === "mycode" ? (
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 460,
            padding: "20px 20px 40px",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 24,
              boxShadow: "0 20px 50px rgba(124,58,237,0.35)",
            }}
          >
            {user?.upiId ? (
              <QRCodeSVG value={upiPayString} size={200} bgColor="#ffffff" fgColor="#0d0821" level="M" />
            ) : (
              <div
                style={{
                  width: 200,
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0d0821",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                No UPI ID found
              </div>
            )}
          </div>

          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 20 }}>{user?.name}</div>
          <button
            onClick={handleCopyUpi}
            className="text-secondary"
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
              fontSize: 13.5,
            }}
          >
            {user?.upiId} <Copy size={13} />
          </button>

          <p className="text-muted mt-16" style={{ fontSize: 12, textAlign: "center", maxWidth: 260 }}>
            Anyone with a UPI app can scan this code to pay you directly to your Arcs Pay wallet.
          </p>

          <button
            className="btn btn-secondary mt-24"
            onClick={() => {
              if (navigator.share) {
                navigator
                  .share({ title: "Pay me on Arcs Pay", text: `Pay me via UPI: ${user?.upiId}` })
                  .catch(() => {});
              } else {
                handleCopyUpi();
              }
            }}
          >
            <Share2 size={16} /> Share My UPI ID
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 420,
            }}
          >
            <p className="text-secondary mb-24" style={{ fontSize: 14, fontWeight: 600 }}>
              {camState === "on" ? "Point at a QR code to pay" : "Scan any QR code to pay"}
            </p>

            <div style={{ position: "relative", width: 240, height: 240 }}>
              {camState === "on" || camState === "starting" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 20,
                    opacity: camState === "on" ? 1 : 0.4,
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: "var(--text-muted)",
                  }}
                >
                  <CameraOff size={28} />
                  <span style={{ fontSize: 12, padding: "0 24px", textAlign: "center", color: "#fff" }}>
                    {camState === "denied"
                      ? "Camera permission denied. Allow access or use Gallery / manual UPI ID."
                      : camState === "starting"
                        ? "Starting camera..."
                        : "Camera unavailable. Use Gallery or enter the UPI ID manually."}
                  </span>
                </div>
              )}

              {[
                { top: 0, left: 0, borderWidth: "4px 0 0 4px", radius: "18px 0 0 0" },
                { top: 0, right: 0, borderWidth: "4px 4px 0 0", radius: "0 18px 0 0" },
                { bottom: 0, left: 0, borderWidth: "0 0 4px 4px", radius: "0 0 0 18px" },
                { bottom: 0, right: 0, borderWidth: "0 4px 4px 0", radius: "0 0 18px 0" },
              ].map((corner, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 46,
                    height: 46,
                    borderStyle: "solid",
                    borderColor: "var(--accent-magenta)",
                    ...corner,
                  }}
                />
              ))}
              {camState === "on" && !found && (
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    right: 8,
                    top: "50%",
                    height: 2,
                    background: "linear-gradient(90deg, transparent, var(--accent-magenta), transparent)",
                    animation: "scanMove 2.2s ease-in-out infinite",
                  }}
                />
              )}

              {found && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 20,
                    background: "rgba(13,10,32,0.75)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={26} color="#fff" strokeWidth={3} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{found.name}</span>
                </div>
              )}
            </div>

            <p className="text-muted mt-24" style={{ fontSize: 12.5 }}>
              {camState === "denied" || camState === "error" ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={startCamera}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}
                >
                  Retry camera
                </button>
              ) : (
                "Align the QR code within the frame"
              )}
            </p>
          </div>

          <div style={{ position: "relative", padding: "0 20px 28px" }}>
            {showManual ? (
              <form onSubmit={handleManualSubmit} className="card">
                <label className="text-secondary" style={{ fontSize: 12.5, fontWeight: 600 }}>
                  Enter UPI ID
                </label>
                <input
                  className="input mt-8"
                  placeholder="name@upi"
                  value={manualUpi}
                  onChange={(e) => setManualUpi(e.target.value)}
                  autoFocus
                />
                <button className="btn btn-primary mt-12" type="submit">
                  Continue
                </button>
              </form>
            ) : (
              <>
                <div className="flex-row" style={{ justifyContent: "center", gap: 48, marginBottom: 20 }}>
                  <button
                    onClick={toggleTorch}
                    disabled={!torchSupported || camState !== "on"}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      color: "#fff",
                      opacity: !torchSupported || camState !== "on" ? 0.4 : 1,
                    }}
                  >
                    <span className="icon-btn" style={{ width: 50, height: 50 }}>
                      <Zap size={20} />
                    </span>
                    <span style={{ fontSize: 11.5 }}>{torchOn ? "Flash Off" : "Flash"}</span>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      color: "#fff",
                    }}
                  >
                    <span className="icon-btn" style={{ width: 50, height: 50 }}>
                      <ImageIcon size={20} />
                    </span>
                    <span style={{ fontSize: 11.5 }}>Gallery</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleGalleryFile}
                />
                <button className="btn btn-secondary" onClick={() => setShowManual(true)}>
                  Enter UPI ID Manually
                </button>
              </>
            )}

            <p className="text-muted mt-16" style={{ textAlign: "center", fontSize: 11, letterSpacing: 1 }}>
              UPI &middot; BHIM
            </p>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style>{`
        @keyframes scanMove {
          0%, 100% { transform: translateY(-90px); opacity: 0.3; }
          50% { transform: translateY(90px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
