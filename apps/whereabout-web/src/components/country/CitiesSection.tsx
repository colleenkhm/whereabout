import { formatPopulation } from "@/lib/format";
import { cssVars } from "@/lib/color";
import type { City } from "@/lib/types";
import styles from "./CitiesSection.module.css";
import section from "./Section.module.css";
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
    <div style={cssVars({ "--accent": accent })}>
      {shown.map((city, i) => {
        const meta = [city.name === capital && "Capital", city.population != null && formatPopulation(city.population)]
          .filter(Boolean)
          .join(" · ");
        const Row = onPick ? "button" : "div";
        return (
          <Row
            key={city.id}
            {...(onPick && { type: "button" as const, onClick: () => onPick(city.name) })}
            className={`${section.row} ${onPick ? section.pick : ""}`}
          >
            <span className={`row-meta ${styles.index}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className={`row-title ${section.rowTitle}`}>
              {city.name}
              {city.isFeatured && <span className={styles.star}>★</span>}
            </span>
            {meta && <span className="row-meta">{meta}</span>}
            {onPick && (
              <span aria-hidden className={styles.chevron}>
                ›
              </span>
            )}
          </Row>
        );
      })}
      <div className={section.footer}>
        <SectionSource list links={[["GeoNames", "https://www.geonames.org/"]]} color={accent} />
      </div>
    </div>
  );
}
