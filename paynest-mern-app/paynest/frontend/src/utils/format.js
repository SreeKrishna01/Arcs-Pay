export const formatCurrency = (amount) => {
  const n = Number(amount) || 0;
  return `\u20b9${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyShort = (amount) => {
  const n = Number(amount) || 0;
  return `\u20b9${n.toLocaleString("en-IN")}`;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

export const formatDateTime = (dateStr) => `${formatDate(dateStr)}, ${formatTime(dateStr)}`;

export const relativeDay = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return formatDateShort(dateStr);
};

const CATEGORY_COLORS = {
  Shopping: "#f59e0b",
  Salary: "#22c55e",
  Subscription: "#ef4444",
  Bill: "#6366f1",
  Transfer: "#8b5cf6",
  Food: "#ec4899",
  "Add Money": "#22c55e",
  default: "#8b5cf6",
};

export const categoryColor = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

export const categoryInitial = (name = "") => (name.trim()[0] || "?").toUpperCase();
