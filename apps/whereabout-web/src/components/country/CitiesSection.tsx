import { formatPopulation } from "@/lib/format";
import type { City } from "@/lib/types";
import SectionSource from "./SectionSource";

const MAX_SHOWN = 5;

// Featured first, then population; capital always leads.
export default function CitiesSection({
  cities,
  capital,
  accent,
  onPick,
}: {
  cities: City[];
  capital: string | null;
  accent: string;
  // Contribute mode: rows become buttons that pick the city.
  onPick?: (name: string) => void;
}) {
  const sorted = [...cities].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.population == null && b.population == null) return 0;
    if (a.population == null) return 1;
    if (b.population == null) return -1;
    return b.population - a.population;
  });
  const capitalCity = sorted.find((c) => c.name === capital);
  const shown = capitalCity
    ? [capitalCity, ...sorted.filter((c) => c !== capitalCity).slice(0, MAX_SHOWN - 1)]
    : sorted.slice(0, MAX_SHOWN);

  return (
    <div>
      {shown.map((city, i) => {
        const meta = [city.name === capital && "Capital", city.population != null && formatPopulation(city.population)]
          .filter(Boolean)
          .join(" · ");
        const Row = onPick ? "button" : "div";
        return (
          <Row
            key={city.id}
            {...(onPick && { type: "button" as const, onClick: () => onPick(city.name) })}
            style={{
              ...(onPick && PICK_RESET),
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 20px",
              borderBottom: i < shown.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <span className="row-meta" style={{ width: 18, color: accent, fontWeight: 600 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="row-title" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {city.name}
              {city.isFeatured && <span style={{ color: "var(--butter-dark)", fontSize: 11, marginLeft: 5 }}>★</span>}
            </span>
            {meta && <span className="row-meta">{meta}</span>}
            {onPick && (
              <span aria-hidden style={{ color: accent, fontWeight: 600 }}>
                ›
              </span>
            )}
          </Row>
        );
      })}
      <div style={{ padding: "0 20px 13px" }}>
        <SectionSource links={[["GeoNames", "https://www.geonames.org/"]]} color={accent} />
      </div>
    </div>
  );
}

const PICK_RESET: React.CSSProperties = {
  width: "100%",
  background: "none",
  border: "none",
  borderRadius: 0,
  textAlign: "left",
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
};
