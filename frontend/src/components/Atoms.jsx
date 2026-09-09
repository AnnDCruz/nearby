export const CATEGORIES = {
  food: { label: "Food", emoji: "🍜", color: "var(--blaze)" },
  event: { label: "Event", emoji: "🎪", color: "var(--lake)" },
  cafe: { label: "Cafe", emoji: "☕", color: "var(--forest)" },
  activity: { label: "Activity", emoji: "🧗", color: "var(--moss)" },
};

export function CategoryBadge({ cat }) {
  const c = CATEGORIES[cat] || CATEGORIES.food;
  return (
    <span className="badge">
      <span style={{ color: c.color }}>{c.emoji}</span>
      {c.label}
    </span>
  );
}

export function LiveDot() {
  return (
    <span className="pin-dot">
      <span className="ping" />
      <span className="core" />
    </span>
  );
}

export function OfflineBanner({ text }) {
  return (
    <div className="offline-banner">
      <span style={{ fontSize: 16 }}>🧭</span>
      <p>{text}</p>
    </div>
  );
}

export function ConnectivityToggle({ online, onToggle }) {
  return (
    <button className="conn-toggle" onClick={onToggle} title="Dev: simulate connectivity for the demo">
      <span className="conn-dot" style={{ background: online ? "var(--forest)" : "var(--blaze)" }} />
      {online ? "Online" : "Offline mode"}
    </button>
  );
}

export function Spinner() {
  return <div className="spinner" />;
}
