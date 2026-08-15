export default function Avatar({ name = "", color = "#8B5CF6", size = 42, fontSize }) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: fontSize || Math.round(size * 0.4),
      }}
    >
      {initials || "?"}
    </div>
  );
}
