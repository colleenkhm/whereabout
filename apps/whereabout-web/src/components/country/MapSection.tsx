"use client";

import dynamic from "next/dynamic";
import type { City } from "@/lib/types";
import SectionSource from "./SectionSource";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapSection(props: {
  latitude: number;
  longitude: number;
  cities: City[];
  capital: string | null;
  accent: string;
}) {
  return (
    <div>
      <MapView {...props} />
      <div style={{ padding: "0 20px 13px" }}>
        <SectionSource
          links={[
            ["OpenStreetMap", "https://www.openstreetmap.org/copyright"],
            ["GeoNames", "https://www.geonames.org/"],
          ]}
          color={props.accent}
        />
      </div>
    </div>
  );
}
