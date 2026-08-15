export default function Switch({ on, onToggle }) {
  return (
    <button
      type="button"
      className={`switch ${on ? "on" : ""}`}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
    >
      <span className="switch-knob" />
    </button>
  );
}
