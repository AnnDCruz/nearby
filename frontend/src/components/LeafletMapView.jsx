import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIES } from "./Atoms";

function makePlaceIcon(cat, isActive) {
  const c = CATEGORIES[cat] || CATEGORIES.food;
  const size = isActive ? 38 : 32;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50% 50% 50% 4px;
        transform:rotate(45deg);
        background:${c.color};
        border:2.5px solid #fffdf7;
        box-shadow:0 3px 8px rgba(30,42,32,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(-45deg);font-size:${isActive ? 16 : 14}px;">${c.emoji}</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#2f7a94;opacity:0.25;transform:scale(1.8);"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#2f7a94;border:2.5px solid #fffdf7;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Keeps the map recentered if the user's location updates (e.g. GPS lock
// arrives after first render) without fighting the user's own pan/zoom.
function RecenterOnFirstFix({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const searchIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:30px;height:30px;border-radius:50% 50% 50% 4px;transform:rotate(45deg);
      background:var(--blaze,#e2672a);border:2.5px solid #fffdf7;
      box-shadow:0 3px 8px rgba(30,42,32,0.35);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(-45deg);font-size:14px;">📍</span>
    </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Flies the map to a searched location whenever a new search result comes in.
function FlyToSearchResult({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 1 });
  }, [target, map]);
  return null;
}

function ManualLocationClickHandler({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMapView({
  places,
  activeId,
  onSelect,
  userLocation,
  locStatus,
  onManualLocation,
  searchTarget,
}) {
  const center = userLocation || { lat: 25.2048, lng: 55.2708 };
  const canPickManually = locStatus === "denied" || locStatus === "unavailable";

  const icons = useMemo(() => {
    const map = {};
    for (const p of places) {
      map[p.id] = makePlaceIcon(p.category, p.id === activeId);
    }
    return map;
  }, [places, activeId]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      zoomControl={false}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "var(--paper)" }}
    >
      <TileLayer
        attribution='Wikimedia maps beta | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png?lang=en"
        detectRetina
      />
      <RecenterOnFirstFix center={userLocation} />
      <ManualLocationClickHandler enabled={canPickManually} onPick={onManualLocation} />
      <FlyToSearchResult target={searchTarget} />

      {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}
      {searchTarget && <Marker position={[searchTarget.lat, searchTarget.lng]} icon={searchIcon} />}

      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons[p.id]}
          eventHandlers={{ click: () => onSelect(p.id === activeId ? null : p.id) }}
        />
      ))}
    </MapContainer>
  );
}