import { useEffect, useState } from "react";
import { api, cacheSaved, getCachedSaved, isPendingSync } from "../api";
import { CATEGORIES } from "../components/Atoms";

export default function SavedTab({ online }) {
  const [saved, setSaved] = useState(() => getCachedSaved());
  const [loading, setLoading] = useState(saved.length === 0 && online);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    api
      .saved()
      .then((res) => {
        if (cancelled) return;
        setSaved(res.saved);
        cacheSaved(res.saved);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [online]);

  return (
    <div style={{ height: "100%", background: "var(--paper)", padding: "16px 16px 0" }}>
      <h2 className="display" style={{ fontSize: 20, margin: "0 0 4px" }}>Saved</h2>
      <p style={{ fontSize: 12.5, color: "var(--stone)", margin: "0 0 16px" }}>
        Always here, even with no signal.
      </p>

      {loading ? (
        <p style={{ color: "var(--stone)", fontSize: 13 }}>Loading…</p>
      ) : saved.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--stone)" }}>
          <p style={{ fontWeight: 700, color: "var(--ink)" }}>Nothing saved yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Tap the heart on a place in the Map tab to keep it here.</p>
        </div>
      ) : (
        <div className="divider-list">
          {saved.map((p) => {
            const cat = CATEGORIES[p.category] || CATEGORIES.food;
            const pending = isPendingSync(p.id);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50% 50% 50% 4px",
                      transform: "rotate(45deg)",
                      background: cat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ transform: "rotate(-45deg)", fontSize: 13 }}>{cat.emoji}</span>
                  </span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "var(--stone)", margin: "2px 0 0" }}>{cat.label}</p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: pending ? "var(--stone-soft)" : "var(--forest)" }}>
                  {pending ? "⏳ Pending" : "✓ Synced"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
