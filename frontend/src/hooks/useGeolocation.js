import { useCallback, useEffect, useState } from "react";

// Falls back to the demo dataset's city area if location isn't available --
// keeps the map centered somewhere with actual seeded places on it.
export const DEFAULT_CENTER = { lat: 25.2048, lng: 55.2708 };

// status: 'locating' | 'granted' | 'denied' | 'unavailable' | 'manual'
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("locating");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setCoords(DEFAULT_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => {
        setStatus("denied");
        setCoords(DEFAULT_CENTER);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Used when permission was denied/unavailable and the person taps the map
  // to set their own reference point instead (per the "manual location" spec).
  const setManual = useCallback((lat, lng) => {
    setCoords({ lat, lng });
    setStatus("manual");
  }, []);

  return { coords, status, setManual };
}