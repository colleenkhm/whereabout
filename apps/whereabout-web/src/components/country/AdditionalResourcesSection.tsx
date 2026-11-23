import { MdArrowOutward } from "react-icons/md";

// Generic, not per country.
export const RESOURCES: [string, string][] = [
  ["Google Translate", "https://translate.google.com"],
  ["Wikitravel", "https://wikitravel.org"],
  ["Radio Garden", "https://radio.garden"],
  ["OpenGuessr", "https://openguessr.com"],
];

export default function AdditionalResourcesSection({ accent }: { accent: string }) {
  return (
    <div>
      {RESOURCES.map(([label, url], i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: i < RESOURCES.length - 1 ? "1px solid var(--rule)" : "none",
          }}
        >
          <span className="row-title" style={{ flex: 1, color: accent }}>
            {label}
          </span>
          <MdArrowOutward size={16} color={accent} aria-hidden />
        </a>
      ))}
    </div>
  );
}
