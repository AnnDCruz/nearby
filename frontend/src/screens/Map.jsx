import { useEffect, useMemo, useState } from "react";
import {
  api,
  cachePlaces,
  getCachedPlaces,
  cacheSaved,
  getCachedSaved,
  queuePendingSync,
  isPendingSync,
} from "../api";
import { CATEGORIES, CategoryBadge, LiveDot, OfflineBanner } from "../components/Atoms";
import TopoBackground from "../components/TopoBackground";

const FILTERS = ["All", "Food", "Events", "Activities"];
const FILTER_MAP = { All: null, Food: "food", Events: "event", Activities: "activity" };

// Deterministic pseudo-position on the map canvas, so pins don't jump around
// between renders (we don't have real device GPS wiring in this MVP).
function pinPosition(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const x = 15 + (hash % 70);
  const y = 15 + ((hash >> 8) % 65);
  return { x, y };
}

export default function MapTab({ online }) {
  const [places, setPlaces] = useState(() => getCachedPlaces());
  const [savedIds, setSavedIds] = useState(() => new Set(getCachedSaved().map((p) => p.id)));
  const [filter, setFilter] = useState("All");
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(places.length === 0);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    setLoading(places.length === 0);
    Promise.all([api.places(), api.saved()])
      .then(([placesRes, savedRes]) => {
        if (cancelled) return;
        setPlaces(placesRes.places);
        cachePlaces(placesRes.places);
        setSavedIds(new Set(savedRes.saved.map((p) => p.id)));
        cacheSaved(savedRes.saved);
      })
      .catch(() => {
        // Network hiccup mid-session: fall back silently to whatever's cached.
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const filtered = useMemo(() => {
    const wanted = FILTER_MAP[filter];
    return places.filter((p) => !wanted || p.category === wanted);
  }, [places, filter]);

  const active = filtered.find((p) => p.id === activeId);

  async function toggleSave(place) {
    const willSave = !savedIds.has(place.id);
    const next = new Set(savedIds);
    willSave ? next.add(place.id) : next.delete(place.id);
    setSavedIds(next);
    cacheSaved(places.filter((p) => next.has(p.id)));

    if (online) {
      try {
        willSave ? await api.save(place.id) : await api.unsave(place.id);
      } catch {
        // If the request fails we leave the optimistic local state as-is and
        // queue it, same as the offline path, so it retries on reconnect.
        queuePendingSync({ type: willSave ? "save" : "unsave", placeId: place.id });
      }
    } else {
      queuePendingSync({ type: willSave ? "save" : "unsave", placeId: place.id });
    }
  }

  return (
    <div style={{ position: "relative", height: "100%", background: "var(--paper)" }}>
      <TopoBackground dimmed={!online} />

      {!online && <OfflineBanner text="You're offline — showing your last saved view of what's nearby." />}

      {online && (
        <div style={{ position: "absolute", top: 12, left: 0, right: 0, zIndex: 5, padding: "0 16px" }}>
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setActiveId(null); }}
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  border: `1.5px solid ${filter === f ? "var(--forest)" : "var(--line)"}`,
                  background: filter === f ? "var(--forest)" : "var(--white)",
                  color: filter === f ? "var(--white)" : "var(--stone)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="center-fill"><span style={{ color: "var(--stone)", fontSize: 13, fontWeight: 600 }}>Loading nearby spots…</span></div>
      ) : filtered.length === 0 ? (
        <div className="center-fill" style={{ flexDirection: "column", gap: 6, padding: 24, textAlign: "center" }}>
          <p style={{ fontWeight: 700 }}>Nothing cached here yet</p>
          <p style={{ color: "var(--stone)", fontSize: 13 }}>Reconnect to load what's nearby.</p>
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, paddingTop: online ? 64 : 12 }}>
            {filtered.map((p) => {
              const pos = pinPosition(p.id);
              const isActive = p.id === activeId;
              const cat = CATEGORIES[p.category] || CATEGORIES.food;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(isActive ? null : p.id)}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -100%) scale(${isActive ? 1.12 : 1})`,
                    zIndex: isActive ? 20 : 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50% 50% 50% 4px",
                      transform: "rotate(45deg)",
                      background: online ? cat.color : "var(--stone-soft)",
                      border: "2.5px solid var(--white)",
                      boxShadow: "0 3px 8px rgba(30,42,32,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ transform: "rotate(-45deg)", fontSize: 14 }}>{cat.emoji}</span>
                  </div>
                  {isActive && (
                    <span style={{ background: "var(--ink)", color: "var(--white)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!active && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 15, paddingBottom: 14 }}>
              <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "8px 16px 0" }}>
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className="card"
                    style={{ minWidth: 156, textAlign: "left", opacity: online ? 1 : 0.75 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span>{CATEGORIES[p.category]?.emoji}</span>
                      {online && p.open ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--forest)" }}>
                          <LiveDot /> Open
                        </span>
                      ) : !online ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--stone)" }}>Cached</span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--blaze-dark)" }}>Closed</span>
                      )}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "var(--stone)", margin: "3px 0 0" }}>{p.distance}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {active && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30, background: "var(--white)", borderTop: "1.5px solid var(--line)", borderRadius: "20px 20px 0 0", padding: 20 }}>
              <div style={{ width: 36, height: 4, background: "var(--line)", borderRadius: 999, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <h3 className="display" style={{ fontSize: 19, margin: 0 }}>{active.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <CategoryBadge cat={active.category} />
                    <span style={{ fontSize: 11, color: "var(--stone)" }}>{active.distance}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSave(active)}
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                    background: savedIds.has(active.id) ? "var(--forest)" : "var(--white)",
                    border: `1.5px solid ${savedIds.has(active.id) ? "var(--forest)" : "var(--line)"}`,
                    color: savedIds.has(active.id) ? "var(--white)" : "var(--stone)",
                  }}
                >
                  {savedIds.has(active.id) ? "♥" : "♡"}
                </button>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--stone)", lineHeight: 1.55, marginTop: 12 }}>{active.description}</p>
              <div style={{ marginTop: 10 }}>
                {!online ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--stone)" }}>Cached — live status unknown</span>
                ) : active.open ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--forest)" }}>
                    <LiveDot /> Open now
                  </span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--blaze-dark)" }}>Closed now</span>
                )}
              </div>
              {isPendingSync(active.id) && (
                <p style={{ fontSize: 11, color: "var(--stone-soft)", marginTop: 8 }}>⏳ Will sync when you're back online</p>
              )}
              <button className="btn-outline" style={{ marginTop: 16 }} onClick={() => setActiveId(null)}>
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
