const ITEMS = [
  { id: "map", label: "Map", icon: "🗺️" },
  { id: "friends", label: "Friends", icon: "🏕️" },
  { id: "saved", label: "Saved", icon: "🔖" },
  { id: "profile", label: "Profile", icon: "🙂" },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={`nav-item ${tab === it.id ? "active" : ""}`}
          onClick={() => setTab(it.id)}
        >
          <span className="nav-icon">{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
