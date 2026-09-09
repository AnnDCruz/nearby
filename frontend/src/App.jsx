import { useEffect, useRef, useState } from "react";
import { api, getToken, getStoredUser, clearSession, getPendingSync, setPendingSync } from "./api";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { ConnectivityToggle } from "./components/Atoms";
import BottomNav from "./components/BottomNav";
import Login from "./screens/Login";
import MapTab from "./screens/Map";
import FriendsTab from "./screens/Friends";
import SavedTab from "./screens/Saved";
import ProfileTab from "./screens/Profile";

export default function App() {
  // Persistent login: if a token exists locally, treat the user as logged in
  // immediately (even before we've checked the network) so a relaunch offline
  // still opens straight into the app, per the offline-first requirement.
  const [user, setUser] = useState(() => getStoredUser());
  const [tab, setTab] = useState("map");
  const realOnline = useOnlineStatus();
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const online = realOnline && !simulatedOffline;

  const flushing = useRef(false);

  // Flush any actions queued while offline (e.g. saves/unsaves) as soon as
  // we're back online, and keep local caches in sync with the server.
  useEffect(() => {
    if (!online || !user || flushing.current) return;
    const queue = getPendingSync();
    if (queue.length === 0) return;

    flushing.current = true;
    (async () => {
      const remaining = [];
      for (const action of queue) {
        try {
          if (action.type === "save") await api.save(action.placeId);
          else await api.unsave(action.placeId);
        } catch {
          remaining.push(action);
        }
      }
      setPendingSync(remaining);
      flushing.current = false;
    })();
  }, [online, user]);

  function handleAuthed(u) {
    setUser(u);
    setTab("map");
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  return (
    <div className="app-shell-outer">
      {user && <ConnectivityToggle online={online} onToggle={() => setSimulatedOffline((s) => !s)} />}
      <div className="app-shell">
        <div className="screen">
          {!user ? (
            <Login onAuthed={handleAuthed} />
          ) : (
            <>
              {tab === "map" && <MapTab online={online} />}
              {tab === "friends" && <FriendsTab online={online} />}
              {tab === "saved" && <SavedTab online={online} />}
              {tab === "profile" && <ProfileTab user={user} onLogout={handleLogout} />}
            </>
          )}
        </div>
        {user && <BottomNav tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}
