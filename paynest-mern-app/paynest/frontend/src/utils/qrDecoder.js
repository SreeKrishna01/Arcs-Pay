import jsQR from "jsqr";

export function decodeCanvas(canvas) {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      return detector
        .detect(canvas)
        .then((codes) => (codes.length ? codes[0].rawValue : null))
        .catch(() => decodeWithJsqr(canvas));
    } catch (err) {
      return decodeWithJsqr(canvas);
    }
  }
  return decodeWithJsqr(canvas);
}

export async function decodeImageSource(source) {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const codes = await detector.detect(source);
      if (codes.length) return codes[0].rawValue;
    } catch (err) {
      /* fall through to jsQR */
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth || source.videoWidth;
  canvas.height = source.naturalHeight || source.videoHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  return decodeWithJsqr(canvas);
}

function decodeWithJsqr(canvas) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    resolve(result ? result.data : null);
  });
}

export function upiFromQrText(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  let upiId = "";
  let name = "";
  try {
    if (trimmed.startsWith("upi://")) {
      const url = new URL(trimmed);
      upiId = url.searchParams.get("pa") || "";
      name = url.searchParams.get("pn") || "";
    } else if (trimmed.includes("pa=")) {
      const match = trimmed.match(/[?&]pa=([^&\s]+)/i);
      if (match) upiId = decodeURIComponent(match[1]);
    } else if (trimmed.includes("@") && !trimmed.includes(" ")) {
      upiId = trimmed;
    }
  } catch (err) {
    return null;
  }
  upiId = upiId.trim().toLowerCase();
  if (upiId && upiId.includes("@")) {
    return { upiId, name: name.trim() || upiId.split("@")[0] };
  }
  return null;
}
