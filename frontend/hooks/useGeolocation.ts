"use client";

import { useCallback, useEffect, useState } from "react";
import ngeohash from "ngeohash";

export type GeolocationStatus = "prompt" | "granted" | "denied" | "unsupported";

type GeolocationState = {
  geohash: string | null;
  lat: number | null;
  lng: number | null;
  status: GeolocationStatus;
  error: string | null;
  insecureContext: boolean;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    geohash: null,
    lat: null,
    lng: null,
    status: "prompt",
    error: null,
    insecureContext:
      typeof window !== "undefined" ? !window.isSecureContext : false,
  });

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.geolocation === "undefined"
    ) {
      setState((current) => ({
        ...current,
        status: "unsupported",
        error: "Geolocation is not supported on this device or browser.",
      }));
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState((current) => ({
        ...current,
        insecureContext: true,
        error:
          "Geolocation is blocked because this page is not served over HTTPS.",
      }));
      return;
    }

    if (typeof navigator.permissions?.query === "function") {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permission) => {
          const status =
            permission.state === "granted"
              ? "granted"
              : permission.state === "denied"
                ? "denied"
                : "prompt";
          setState((current) => ({ ...current, status }));
        })
        .catch(() => {
          // Permissions API unavailable — keep initial "prompt" status
        });
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.geolocation === "undefined"
    ) {
      setState((current) => ({
        ...current,
        status: "unsupported",
        error: "Geolocation is not supported on this device or browser.",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Privacy rule: raw lat/lng are used only to derive the geohash
        // cell and are never logged or persisted.
        const geohash = ngeohash.encode(lat, lng, 6);
        setState({
          geohash,
          lat,
          lng,
          status: "granted",
          error: null,
          insecureContext: false,
        });
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        const insecure =
          typeof window !== "undefined" && !window.isSecureContext;
        setState((current) => ({
          ...current,
          status: denied ? "denied" : current.status,
          insecureContext: insecure || current.insecureContext,
          error: denied
            ? insecure
              ? "Location is blocked because this page is not served over HTTPS."
              : "Location access was denied."
            : error.message || "Could not determine your location.",
        }));
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  return { ...state, requestLocation };
}