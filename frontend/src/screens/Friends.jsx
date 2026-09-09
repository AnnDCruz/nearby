import { useEffect, useState } from "react";
import { api } from "../api";
import { CategoryBadge, LiveDot, OfflineBanner, Spinner } from "../components/Atoms";

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso + "Z").getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function FriendsTab({ online }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handle, setHandle] = useState("");
  const [addStatus, setAddStatus] = useState(null); // {ok, message}
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!online) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .feed()
      .then((res) => !cancelled && setFeed(res.updates))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [online]);

  async function addFriend(e) {
    e.preventDefault();
    if (!handle.trim()) return;
    setAdding(true);
    setAddStatus(null);
    try {
      const res = await api.addFriend(handle.trim());
      setAddStatus({ ok: true, message: `You're now connected with ${res.friend.name}.` });
      setHandle("");
    } catch (err) {
      setAddStatus({ ok: false, message: err.message });
    } finally {
      setAdding(false);
    }
  }

  if (!online) {
    return (
      <div style={{ height: "100%", background: "var(--paper)" }}>
        <OfflineBanner text="Live updates need a connection — reconnect to see what friends are finding right now." />
        <div style={{ padding: "0 16px", marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                border: "1.5px dashed var(--line)",
                borderRadius: 14,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "var(--stone-soft)", fontSize: 13, fontWeight: 600, margin: 0 }}>Feed paused offline</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", background: "var(--paper)", paddingBottom: 16 }}>
      <form onSubmit={addFriend} style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--white)", border: "1.5px solid var(--line)", borderRadius: 14, padding: "6px 6px 6px 14px" }}>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Add a friend by email"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, padding: "6px 0" }}
          />
          <button type="submit" className="btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: 13 }} disabled={adding}>
            {adding ? <Spinner /> : "Add"}
          </button>
        </div>
        {addStatus && (
          <div className={addStatus.ok ? "form-success" : "form-error"} style={{ marginTop: 8 }}>
            {addStatus.message}
          </div>
        )}
      </form>

      <div style={{ padding: "16px 16px 0" }}>
        {loading ? (
          <div className="center-fill" style={{ paddingTop: 40 }}><Spinner /></div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--stone)" }}>
            <p style={{ fontWeight: 700, color: "var(--ink)" }}>No updates yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Add a friend to start seeing what's happening nearby.</p>
          </div>
        ) : (
          <div className="divider-list">
            {feed.map((f) => (
              <div key={f.id} style={{ padding: "16px 4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--paper-deep)", border: "1.5px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--stone)" }}>
                      {initials(f.authorName)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{f.authorName}</p>
                      <p style={{ fontSize: 11, color: "var(--stone)", margin: "2px 0 0" }}>
                        {timeAgo(f.createdAt)}{f.place ? ` · ${f.place.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LiveDot />
                    <span className={`badge ${f.authorType === "organizer" ? "badge-official" : "badge-friend"}`}>
                      {f.authorType === "organizer" ? "Official" : "Friend"}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--stone)", lineHeight: 1.5, margin: 0 }}>{f.message}</p>
                {f.place && (
                  <div style={{ marginTop: 8 }}>
                    <CategoryBadge cat={f.place.category} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
