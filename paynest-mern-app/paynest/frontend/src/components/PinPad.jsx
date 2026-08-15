import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function PinPad({ length = 6, value, onChange }) {
  const handlePress = (key) => {
    if (key === "") return;
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < length) {
      onChange(value + key);
    }
  };

  return (
    <div>
      <div className="pin-dots">
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={`pin-dot ${i < value.length ? "filled" : ""}`} />
        ))}
      </div>
      <div className="keypad">
        {KEYS.map((key, i) =>
          key === "" ? (
            <div key={i} />
          ) : (
            <button
              type="button"
              key={i}
              className="key-btn"
              onClick={() => handlePress(key)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {key === "back" ? <Delete size={20} /> : key}
            </button>
          )
        )}
      </div>
    </div>
  );
}
