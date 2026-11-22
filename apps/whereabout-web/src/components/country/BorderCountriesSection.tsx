import Link from "next/link";
import { MdChevronRight } from "react-icons/md";
import type { CountrySummary } from "@/lib/types";
import SectionSource from "./SectionSource";

type Landform = { label: string; description: string; mounds: [number, number, number][] };

const ISLAND: Landform = {
  label: "Island",
  description: "No land borders — surrounded entirely by water.",
  mounds: [[0.5, 0.26, 0.42]],
};
const ARCHIPELAGO: Landform = {
  label: "Archipelago",
  description: "No land borders — a chain of islands surrounded by water.",
  mounds: [
    [0.24, 0.13, 0.26],
    [0.52, 0.17, 0.38],
    [0.8, 0.11, 0.2],
  ],
};
const ISLAND_CONTINENT: Landform = {
  label: "Island continent",
  description: "No land borders — a whole continent surrounded by water.",
  mounds: [[0.5, 0.42, 0.36]],
};
const CONTINENT: Landform = {
  label: "Continent",
  description: "No land borders — a continent surrounded by ocean.",
  mounds: [[0.5, 0.42, 0.36]],
};

// Hand-set; anything unlisted defaults to island.
const ARCHIPELAGOS = new Set(
  "AG AS AX BH BM BS CC CK CV FJ FM FO GD GS JP KI KM KN KY MH MP MT MV NC NZ PF PH PN PW SB SC SJ ST TC TK TO TT TV UM VC VG VI VU WF WS".split(" "),
);

export function landformFor(iso: string): Landform {
  const code = iso.toUpperCase();
  if (code === "AU") return ISLAND_CONTINENT;
  if (code === "AQ") return CONTINENT;
  return ARCHIPELAGOS.has(code) ? ARCHIPELAGO : ISLAND;
}

export default function BorderCountriesSection({
  isoCode,
  codes,
  allCountries,
  accent,
}: {
  isoCode: string;
  codes: string[];
  allCountries: CountrySummary[];
  accent: string;
}) {
  if (codes.length === 0) return <NoLandBorders landform={landformFor(isoCode)} accent={accent} />;

  const names = new Map(allCountries.map((c) => [c.isoCode, c.nameCommon]));
  return (
    <div>
      {codes.map((code, i) => {
        const name = names.get(code);
        const rowStyle = {
          display: "flex",
          alignItems: "center",
          padding: "13px 20px",
          borderBottom: i < codes.length - 1 ? "1px solid var(--rule)" : "none",
        };
        // Only a resolvable country links.
        return name ? (
          <Link key={code} href={`/country/${code.toLowerCase()}/`} style={rowStyle}>
            <span className="row-title" style={{ flex: 1 }}>{name}</span>
            <MdChevronRight size={16} color={accent} aria-hidden />
          </Link>
        ) : (
          <div key={code} style={rowStyle}>
            <span className="row-title">{code}</span>
          </div>
        );
      })}
      <div style={{ padding: "0 20px 13px" }}>
        <SectionSource links={[["mledoze/countries", "https://github.com/mledoze/countries"]]} color={accent} />
      </div>
    </div>
  );
}

function NoLandBorders({ landform, accent }: { landform: Landform; accent: string }) {
  const w = 64, h = 40, waterY = h * 0.62;
  const wave = (y: number, inset: number) => {
    const segW = (w * (1 - 2 * inset)) / 4;
    let d = `M${inset * w} ${y}`;
    for (let i = 0; i < 4; i++) {
      const x0 = inset * w + i * segW;
      d += ` Q${x0 + segW / 2} ${y + (i % 2 === 0 ? -3 : 3)} ${x0 + segW} ${y}`;
    }
    return d;
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }} aria-hidden>
        {landform.mounds.map(([cx, hw, mh]) => (
          <path
            key={cx}
            d={`M${(cx - hw) * w} ${waterY} Q${cx * w} ${waterY - mh * h * 2} ${(cx + hw) * w} ${waterY} Z`}
            fill={accent}
            fillOpacity={0.85}
          />
        ))}
        {[wave(waterY + 1, 0), wave(waterY + h * 0.2, 0.12)].map((d) => (
          <path key={d} d={d} fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={1.5} strokeLinecap="round" />
        ))}
      </svg>
      <div>
        <div className="row-title">{landform.label}</div>
        <p className="s-body" style={{ marginTop: 2, color: "var(--ink-3)" }}>
          {landform.description}
        </p>
      </div>
    </div>
  );
}
