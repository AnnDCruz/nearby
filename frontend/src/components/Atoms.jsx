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

export function VisibilityIcon({ off = false, size = 20 }) {
  return off ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 6.5c2.76 0 5 2.24 5 5 0 .51-.1 1-.24 1.46l3.06 3.06c1.39-1.23 2.49-2.77 3.18-4.53-1.73-4.39-6-7.5-11-7.5-1.27 0-2.49.2-3.64.57l2.17 2.17c.47-.11.96-.17 1.47-.17zM2.71 3.16c-.39.39-.39 1.02 0 1.41l1.97 1.97C3.06 7.83 1.77 9.53 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.42 2.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L4.13 3.16c-.39-.39-1.03-.39-1.42 0zM12 17c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.14l1.57 1.57c-.03.18-.06.37-.06.57 0 1.66 1.34 3 3 3 .2 0 .38-.03.57-.07L14.14 16.5c-.65.31-1.37.5-2.14.5zm2.97-5.33c-.15-1.4-1.25-2.49-2.64-2.64l2.64 2.64z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}