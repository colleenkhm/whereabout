"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { City } from "@/lib/types";

const FALLBACK_ZOOM = 5;
const MAX_FIT_ZOOM = 9;

// Leaflet touches window; load via next/dynamic with ssr: false.
export default function MapView({
  latitude,
  longitude,
  cities,
  capital,
  accent,
}: {
  latitude: number;
  longitude: number;
  cities: City[];
  capital: string | null;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const placed = cities.filter((c) => c.latitude != null && c.longitude != null);
    for (const c of placed) {
      const isCapital = c.name === capital;
      L.circleMarker([c.latitude!, c.longitude!], {
        radius: isCapital ? 7 : 5,
        color: "#fff",
        weight: 1.5,
        fillColor: accent,
        fillOpacity: isCapital ? 1 : 0.8,
      })
        .bindTooltip(isCapital ? `${c.name} · Capital` : c.name)
        .addTo(map);
    }

    if (placed.length > 1) {
      map.fitBounds(L.latLngBounds(placed.map((c) => [c.latitude!, c.longitude!])), {
        padding: [24, 24],
        maxZoom: MAX_FIT_ZOOM,
      });
    } else {
      const only = placed[0];
      map.setView(only ? [only.latitude!, only.longitude!] : [latitude, longitude], FALLBACK_ZOOM);
    }
    return () => {
      map.remove();
    };
  }, [latitude, longitude, cities, capital, accent]);

  return <div ref={ref} style={{ height: 280, width: "100%", background: "var(--rule)" }} />;
}
